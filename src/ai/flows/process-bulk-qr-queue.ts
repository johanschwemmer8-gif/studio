'use server';

/**
 * @fileOverview Canonical Bulk Activation / Deployment queue processor.
 *
 * ARCHITECTURE:
 *
 *   bulkQrRequests/{requestId}
 *        ↓
 *   items/{itemId}
 *        ↓
 *   canonical Activation DRAFT
 *        ↓
 *   canonical Deployment(s) NOT_ASSIGNED
 *
 * IMPORTANT:
 * - One bulk item defines one Activation.
 * - One Activation may create one or more Deployments.
 * - Stable business IDs are persisted on the queue item before records are created.
 * - Retries recover the same Activation and Deployment identities.
 * - This processor does NOT create, bind, activate, or deploy QR identities.
 * - QR binding occurs later through the canonical Deployment / QR lifecycle.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { createActivationInternal } from '@/lib/activation-internal';
import { createDeploymentInternal } from '@/lib/deployment-internal';
import { BulkActivationWorkItemSchema } from '@/lib/schemas/bulk-qr-request';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const ProcessBulkQrQueueOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  processedRequestId: z.string().optional(),
  itemsProcessed: z.number().optional(),
  itemsRetried: z.number().optional(),
});

export type ProcessBulkQrQueueOutput = z.infer<
  typeof ProcessBulkQrQueueOutputSchema
>;

export type ProcessBulkQrRequestResult = {
  processedRequestId: string;
  itemsProcessed: number;
  lockAcquired: boolean;
};

type StableItemIdentities = {
  activationId: string;
  deploymentIds: string[];
};

function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`INVALID_BULK_REQUEST: ${fieldName} is required.`);
  }

  return value;
}

async function ensureStableItemIdentities(
  itemRef: FirebaseFirestore.DocumentReference,
  deploymentCount: number
): Promise<StableItemIdentities> {
  const db = admin.firestore();

  return db.runTransaction(async (transaction) => {
    const currentSnapshot = await transaction.get(itemRef);

    if (currentSnapshot.exists === false) {
      throw new Error('BULK_ITEM_NOT_FOUND');
    }

    const currentData = currentSnapshot.data() || {};

    const existingActivationId =
      typeof currentData.activationId === 'string' &&
      currentData.activationId.trim().length > 0
        ? currentData.activationId
        : undefined;

    const existingDeploymentIds = Array.isArray(currentData.deploymentIds)
      ? currentData.deploymentIds
      : [];

    const activationId =
      existingActivationId || db.collection('activations').doc().id;

    const deploymentIds = Array.from(
      { length: deploymentCount },
      (_, index) => {
        const existingId = existingDeploymentIds[index];

        if (typeof existingId === 'string' && existingId.trim().length > 0) {
          return existingId;
        }

        return db.collection('deployments').doc().id;
      }
    );

    const identitiesAlreadyStable =
      existingActivationId === activationId &&
      existingDeploymentIds.length === deploymentCount &&
      deploymentIds.every(
        (deploymentId, index) =>
          existingDeploymentIds[index] === deploymentId
      );

    if (identitiesAlreadyStable === false) {
      transaction.update(itemRef, {
        activationId,
        deploymentIds,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return {
      activationId,
      deploymentIds,
    };
  });
}

async function processCanonicalItem(
  itemDoc: FirebaseFirestore.QueryDocumentSnapshot,
  requestData: FirebaseFirestore.DocumentData
): Promise<void> {
  const retailerId = requireNonEmptyString(
    requestData.retailerId,
    'retailerId'
  );

  const submittedBy = requireNonEmptyString(
    requestData.submittedBy,
    'submittedBy'
  );

  const itemData = itemDoc.data();

  const workItem = BulkActivationWorkItemSchema.parse({
    activation: itemData.activation,
    deployments: itemData.deployments,
  });

  const stableIds = await ensureStableItemIdentities(
    itemDoc.ref,
    workItem.deployments.length
  );

  await createActivationInternal({
    activationId: stableIds.activationId,
    retailerId,
    actorUid: submittedBy,
    activation: workItem.activation,
  });

  for (let index = 0; index < workItem.deployments.length; index += 1) {
    await createDeploymentInternal({
      deploymentId: stableIds.deploymentIds[index],
      retailerId,
      activationId: stableIds.activationId,
      actorUid: submittedBy,
      deployment: workItem.deployments[index],
    });
  }

  await itemDoc.ref.update({
    status: 'DONE',
    activationId: stableIds.activationId,
    deploymentIds: stableIds.deploymentIds,
    qrCodeIds: [],
    error: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function refreshRequestStatus(
  requestRef: FirebaseFirestore.DocumentReference
): Promise<void> {
  const itemsSnapshot = await requestRef.collection('items').get();

  if (itemsSnapshot.empty) {
    await requestRef.update({
      status: 'FAILED',
      error: 'BULK_REQUEST_EMPTY: No work items were found.',
      itemsDone: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  const itemData = itemsSnapshot.docs.map((doc) => doc.data());

  const itemsDone = itemData.filter(
    (item) => item.status === 'DONE'
  ).length;

  const allDone = itemsDone === itemData.length;

  const hasExhaustedError = itemData.some(
    (item) =>
      item.status === 'ERROR' &&
      typeof item.retryCount === 'number' &&
      item.retryCount >= 3
  );

  if (allDone) {
    await requestRef.update({
      status: 'COMPLETED',
      itemsDone,
      error: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  if (hasExhaustedError) {
    await requestRef.update({
      status: 'FAILED',
      itemsDone,
      error:
        'One or more bulk items exhausted their retry allowance.',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  await requestRef.update({
    status: 'QUEUED',
    itemsDone,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function recordItemError(
  itemRef: FirebaseFirestore.DocumentReference,
  error: unknown
): Promise<void> {
  const message =
    error instanceof Error ? error.message : 'Unknown processing error';

  await itemRef.update({
    status: 'ERROR',
    error: message,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Process one exact technical Bulk Activation request.
 *
 * This server-side primitive does not discover another request and does not
 * perform the generic worker's global ERROR retry sweep.
 */
export async function processBulkQrRequest(
  requestRef: FirebaseFirestore.DocumentReference
): Promise<ProcessBulkQrRequestResult> {
  const db = admin.firestore();
  const processedRequestId = requestRef.id;
  let lockAcquired = false;
  let itemsProcessed = 0;

  try {
    await db.runTransaction(async (transaction) => {
      const currentDoc = await transaction.get(requestRef);

      if (currentDoc.exists === false) {
        throw new Error('BULK_REQUEST_NOT_FOUND');
      }

      const currentStatus = currentDoc.data()?.status;

      if (currentStatus !== 'QUEUED' && currentStatus !== 'FAILED') {
        throw new Error('REQUEST_LOCKED');
      }

      transaction.update(requestRef, {
        status: 'PROCESSING',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    lockAcquired = true;

    const lockedRequestDoc = await requestRef.get();

    if (lockedRequestDoc.exists === false) {
      throw new Error('Bulk request disappeared during processing.');
    }

    const requestData = lockedRequestDoc.data() || {};

    requireNonEmptyString(requestData.retailerId, 'retailerId');
    requireNonEmptyString(requestData.submittedBy, 'submittedBy');

    const pendingItemsSnapshot = await requestRef
      .collection('items')
      .where('status', '==', 'PENDING')
      .limit(100)
      .get();

    itemsProcessed = pendingItemsSnapshot.size;

    for (const itemDoc of pendingItemsSnapshot.docs) {
      try {
        await processCanonicalItem(itemDoc, requestData);
      } catch (error: unknown) {
        await recordItemError(itemDoc.ref, error);
      }
    }

    const remainingCapacity = 100 - pendingItemsSnapshot.size;

    if (remainingCapacity > 0) {
      const erroredItemsSnapshot = await requestRef
        .collection('items')
        .where('status', '==', 'ERROR')
        .get();

      const retryableItems = erroredItemsSnapshot.docs
        .filter((itemDoc) => {
          const retryCount = itemDoc.data().retryCount;
          return typeof retryCount !== 'number' || retryCount < 3;
        })
        .slice(0, remainingCapacity);

      itemsProcessed += retryableItems.length;

      for (const itemDoc of retryableItems) {
        try {
          await itemDoc.ref.update({
            retryCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          await processCanonicalItem(itemDoc, requestData);
        } catch (error: unknown) {
          await recordItemError(itemDoc.ref, error);
        }
      }
    }

    await refreshRequestStatus(requestRef);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown request error';

    if (message === 'REQUEST_LOCKED') {
      console.log(
        `[QR Management] Bulk request ${processedRequestId} is already being processed or is no longer QUEUED.`
      );
    } else {
      if (lockAcquired) {
        await requestRef.update({
          status: 'FAILED',
          error: message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      console.error(
        `[QR Management] Failed to process bulk request ${processedRequestId}:`,
        message
      );
    }
  }

  return {
    processedRequestId,
    itemsProcessed,
    lockAcquired,
  };
}

const processBulkQrQueueFlow = ai.defineFlow(
  {
    name: 'processBulkQrQueueFlow',
    outputSchema: ProcessBulkQrQueueOutputSchema,
  },
  async () => {
    const db = admin.firestore();

    let itemsProcessedCount = 0;
    let itemsRetriedCount = 0;
    let processedRequestId: string | undefined;

    const requestsRef = db.collection('bulkQrRequests');

    const queuedRequestQuery = requestsRef
      .where('status', '==', 'QUEUED')
      .orderBy('createdAt')
      .limit(1);

    const queuedSnapshot = await queuedRequestQuery.get();

    if (queuedSnapshot.empty === false) {
      const requestDoc = queuedSnapshot.docs[0];
      processedRequestId = requestDoc.id;

      const result = await processBulkQrRequest(requestDoc.ref);
      itemsProcessedCount = result.itemsProcessed;
    }

    const erroredItemsSnapshot = await db
      .collectionGroup('items')
      .where('status', '==', 'ERROR')
      .where('retryCount', '<', 3)
      .limit(50)
      .get();

    itemsRetriedCount = erroredItemsSnapshot.size;

    for (const itemDoc of erroredItemsSnapshot.docs) {
      const requestRef = itemDoc.ref.parent.parent;

      if (requestRef == null) {
        continue;
      }

      const requestDoc = await requestRef.get();

      if (requestDoc.exists === false) {
        continue;
      }

      const requestData = requestDoc.data() || {};

      try {
        await itemDoc.ref.update({
          retryCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await processCanonicalItem(itemDoc, requestData);
      } catch (error: unknown) {
        await recordItemError(itemDoc.ref, error);
      }

      await refreshRequestStatus(requestRef);
    }

    const messages: string[] = [];

    if (itemsProcessedCount > 0) {
      messages.push(
        `Processed ${itemsProcessedCount} canonical bulk item(s) for request ${processedRequestId}.`
      );
    }

    if (itemsRetriedCount > 0) {
      messages.push(
        `Retried ${itemsRetriedCount} errored canonical bulk item(s).`
      );
    }

    if (messages.length === 0) {
      messages.push('No new or errored bulk items to process.');
    }

    return {
      success: true,
      message: messages.join(' '),
      processedRequestId,
      itemsProcessed: itemsProcessedCount,
      itemsRetried: itemsRetriedCount,
    };
  }
);

export async function processBulkQrQueue(): Promise<ProcessBulkQrQueueOutput> {
  return processBulkQrQueueFlow();
}
