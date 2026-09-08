'use server';

/**
 * @fileOverview Process queued QR Activation requests.
 *
 * ARCHITECTURE:
 *
 *   RETAILER ACTIVATION
 *        ↓
 *   bulkQrRequests/{requestId}
 *        ↓
 *   items/{qrCodeId}
 *        ↓
 *   PROCESSING
 *        ↓
 *   qrcodes/{qrCodeId}
 *        ↓
 *   SHOPPER SCAN
 *
 * IMPORTANT:
 * - One activation represents one Point-of-Decision objective.
 * - One activation produces one QR in the current retailer workflow.
 * - The QR is the digital identity of the activation.
 * - The QR is NOT the product identity.
 * - GTIN remains the authoritative product identifier.
 * - Target and Product Context remain separate.
 *
 * The final qrcodes record deliberately retains activation context so that
 * future measurement and Retail Media functionality can connect:
 *
 * Campaign
 *   → Activation
 *   → Target
 *   → Store / Location
 *   → QR
 *   → Shopper Engagement
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
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

/**
 * Production base URL used when NEXT_PUBLIC_BASE_URL is not configured.
 *
 * This prevents physical QR codes from encoding a relative path such as:
 *
 *   /resolve/{qrCodeId}
 *
 * which would not be a valid standalone QR destination.
 */
const getBaseUrl = () => {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  return 'https://interactaoe.co.za';
};

const generateQrForItem = (
  item: FirebaseFirestore.DocumentData,
  requestData: FirebaseFirestore.DocumentData
) => {
  const qrCodeId = item.qrCodeId;

  if (!qrCodeId) {
    throw new Error('QR code ID is missing from activation item.');
  }

  const qrOptions = requestData.options || {};

  const qrColor = qrOptions.colorHex
    ? String(qrOptions.colorHex).replace('#', '')
    : '000000';

  const qrBgColor = qrOptions.bgColorHex
    ? String(qrOptions.bgColorHex).replace('#', '')
    : 'ffffff';

  const qrError = qrOptions.logoPath
    ? 'H'
    : qrOptions.errorCorrection || 'M';

  /*
   * The activation item should already contain an absolute tracking URL.
   * If it does not, construct one here as a defensive fallback.
   */
  const trackingUrl =
    item.trackingUrl ||
    `${getBaseUrl()}/resolve/${qrCodeId}`;

  const encodedQrData = encodeURIComponent(trackingUrl);

  let generatedQrUrl =
    `https://api.qrserver.com/v1/create-qr-code/?` +
    `size=512x512` +
    `&data=${encodedQrData}` +
    `&color=${qrColor}` +
    `&bgcolor=${qrBgColor}` +
    `&ecc=${qrError}`;

  if (qrOptions.logoPath) {
    generatedQrUrl +=
      `&logo=${encodeURIComponent(qrOptions.logoPath)}`;
  }

  const storagePath =
    `qr/${requestData.retailerId}/` +
    `${requestData.campaignId}/` +
    `${qrCodeId}.png`;

  return {
    status: 'DONE',
    storagePath,
    signedUrl: generatedQrUrl,
    trackingUrl,
    checksum: '',
    error: admin.firestore.FieldValue.delete(),
  };
};

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

    /*
     * ============================================================
     * 1. PROCESS ONE QUEUED ACTIVATION REQUEST
     * ============================================================
     */

    const requestsRef = db.collection('bulkQrRequests');

    const queuedRequestQuery = requestsRef
      .where('status', '==', 'QUEUED')
      .orderBy('createdAt')
      .limit(1);

    const queuedSnapshot =
      await queuedRequestQuery.get();

    if (!queuedSnapshot.empty) {
      const requestDoc = queuedSnapshot.docs[0];

      processedRequestId = requestDoc.id;

      try {
        /*
         * Lock the request before processing it.
         */
        await db.runTransaction(async (transaction) => {
          const currentDoc =
            await transaction.get(requestDoc.ref);

          if (!currentDoc.exists) {
            throw new Error(
              'Activation request no longer exists.'
            );
          }

          if (
            currentDoc.data()?.status !== 'QUEUED'
          ) {
            throw new Error(
              'Request was locked by another process.'
            );
          }

          transaction.update(requestDoc.ref, {
            status: 'PROCESSING',
            updatedAt:
              admin.firestore.FieldValue.serverTimestamp(),
          });
        });

        /*
         * Re-read the request after acquiring the lock so that the
         * processor works with the authoritative persisted activation.
         */
        const lockedRequestDoc =
          await requestDoc.ref.get();

        if (!lockedRequestDoc.exists) {
          throw new Error(
            'Activation request disappeared during processing.'
          );
        }

        const requestData =
          lockedRequestDoc.data() || {};

        const itemsRef =
          requestDoc.ref.collection('items');

        const pendingItemsQuery = itemsRef
          .where('status', '==', 'PENDING')
          .limit(100);

        const pendingItemsSnapshot =
          await pendingItemsQuery.get();

        if (!pendingItemsSnapshot.empty) {
          itemsProcessedCount =
            pendingItemsSnapshot.size;

          const batch = db.batch();

          for (
            const itemDoc of pendingItemsSnapshot.docs
          ) {
            const itemData = itemDoc.data();

            const updateData =
              generateQrForItem(
                itemData,
                requestData
              );

            /*
             * Update the activation item.
             */
            batch.update(
              itemDoc.ref,
              {
                ...updateData,
                updatedAt:
                  admin.firestore.FieldValue.serverTimestamp(),
              }
            );

            /*
             * Create the authoritative QR master record.
             *
             * IMPORTANT:
             * The activation context is deliberately copied here.
             * This prevents the final QR record from becoming detached
             * from the retailer's original Point-of-Decision intent.
             */
            const qrMasterRef =
              db
                .collection('qrcodes')
                .doc(itemData.qrCodeId);

            batch.set(
              qrMasterRef,
              {
                /*
                 * Core identity / relationships
                 */
                retailerId:
                  requestData.retailerId,

                campaignId:
                  requestData.campaignId,

                requestId:
                  lockedRequestDoc.id,

                qrCodeId:
                  itemData.qrCodeId,

                /*
                 * Activation target
                 */
                target:
                  requestData.target || {
                    category: null,
                    subCategory: null,
                    productType: null,
                    brandId: null,
                    brandName: null,
                    targetProductName: null,
                    targetProductGtin:
                      itemData.targetProductGtin ||
                      null,
                  },

                /*
                 * Exact promoted product, where applicable.
                 *
                 * This is intentionally separate from productGtins.
                 */
                targetProductGtin:
                  requestData.target
                    ?.targetProductGtin ||
                  itemData.targetProductGtin ||
                  null,

                /*
                 * Shopper decision / comparison context.
                 *
                 * These products do NOT represent separate QR identities.
                 */
                productGtins:
                  requestData.productGtins ||
                  itemData.productGtins ||
                  [],

                /*
                 * Physical Point-of-Decision context
                 */
                storeId:
                  requestData.storeId ||
                  itemData.storeId ||
                  null,

                storeName:
                  requestData.storeName ||
                  itemData.storeName ||
                  null,

                location:
                  requestData.location ||
                  itemData.location ||
                  null,

                /*
                 * Shopper objective
                 */
                shopperObjective:
                  requestData.shopperObjective ||
                  null,

                /*
                 * Product-friendly legacy field retained for compatibility.
                 */
                productName:
                  requestData.productName ||
                  requestData.target
                    ?.targetProductName ||
                  null,

                /*
                 * Scan / destination infrastructure
                 */
                redirectUrl:
                  itemData.finalRedirectUrl ||
                  '',

                trackingUrl:
                  updateData.trackingUrl,

                storagePath:
                  updateData.storagePath,

                signedUrl:
                  updateData.signedUrl,

                /*
                 * Measurement
                 */
                scanCount: 0,

                /*
                 * QR / GS1 state
                 */
                isGs1Compliant:
                  requestData.isGs1Compliant ??
                  true,

                dataStatus:
                  requestData.dataStatus ||
                  'VERIFIED',

                status: 'ACTIVE',

                /*
                 * Preserve relevant activation options.
                 * This gives downstream experiences access to the
                 * configured AI / destination behaviour without having
                 * to look up the request first.
                 */
                options:
                  requestData.options ||
                  {},

                /*
                 * Timestamps
                 */
                createdAt:
                  admin.firestore.FieldValue.serverTimestamp(),

                updatedAt:
                  admin.firestore.FieldValue.serverTimestamp(),

                expiresAt:
                  requestData.options?.expiresAt
                    ? new Date(
                        requestData.options.expiresAt
                      )
                    : null,
              },
              { merge: true }
            );
          }

          await batch.commit();
        }

        /*
         * Determine whether every activation item has completed.
         */
        const allItemsSnapshot =
          await itemsRef.get();

        const allItemsDone =
          !allItemsSnapshot.empty &&
          allItemsSnapshot.docs.every(
            (doc) =>
              doc.data().status === 'DONE'
          );

        if (allItemsDone) {
          await requestDoc.ref.update({
            status: 'COMPLETED',
            itemsDone:
              allItemsSnapshot.size,
            updatedAt:
              admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          /*
           * Keep the request in PROCESSING if there are still
           * pending items to be handled by another invocation.
           */
          await requestDoc.ref.update({
            status: 'QUEUED',
            itemsDone:
              allItemsSnapshot.docs.filter(
                (doc) =>
                  doc.data().status === 'DONE'
              ).length,
            updatedAt:
              admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unknown processing error';

        if (message === 'Request was locked by another process.') {
          console.log(
            `[QR Management] Activation ${processedRequestId} is already being processed by another worker.`
          );
        } else {
          if (processedRequestId) {
            await requestsRef
              .doc(processedRequestId)
              .update({
                status: 'FAILED',
                error: message,
                updatedAt:
                  admin.firestore.FieldValue.serverTimestamp(),
              });
          }

          console.error(
            `[QR Management] Failed to process activation ${processedRequestId}:`,
            message
          );
        }
      }
    }

    /*
     * ============================================================
     * 2. RETRY ERRORED ACTIVATION ITEMS
     * ============================================================
     *
     * This remains global because the existing queue architecture
     * stores activation items beneath each bulkQrRequests document.
     */

    const erroredItemsQuery =
      db
        .collectionGroup('items')
        .where('status', '==', 'ERROR')
        .where('retryCount', '<', 3)
        .limit(50);

    const erroredItemsSnapshot =
      await erroredItemsQuery.get();

    if (!erroredItemsSnapshot.empty) {
      itemsRetriedCount =
        erroredItemsSnapshot.size;

      for (
        const itemDoc of erroredItemsSnapshot.docs
      ) {
        const itemData =
          itemDoc.data();

        const requestRef =
          itemDoc.ref.parent.parent;

        if (!requestRef) {
          continue;
        }

        const requestDoc =
          await requestRef.get();

        if (!requestDoc.exists) {
          continue;
        }

        const requestData =
          requestDoc.data() || {};

        try {
          const updateData =
            generateQrForItem(
              itemData,
              requestData
            );

          const batch = db.batch();

          /*
           * Return the activation item to DONE.
           */
          batch.update(
            itemDoc.ref,
            {
              ...updateData,
              retryCount:
                admin.firestore.FieldValue.increment(
                  1
                ),
              updatedAt:
                admin.firestore.FieldValue.serverTimestamp(),
            }
          );

          /*
           * Update the authoritative QR record with the
           * same activation context used by the normal path.
           */
          const qrMasterRef =
            db
              .collection('qrcodes')
              .doc(itemData.qrCodeId);

          batch.set(
            qrMasterRef,
            {
              retailerId:
                requestData.retailerId,

              campaignId:
                requestData.campaignId,

              requestId:
                requestDoc.id,

              qrCodeId:
                itemData.qrCodeId,

              target:
                requestData.target || {
                  category: null,
                  subCategory: null,
                  productType: null,
                  brandId: null,
                  brandName: null,
                  targetProductName: null,
                  targetProductGtin:
                    itemData.targetProductGtin ||
                    null,
                },

              targetProductGtin:
                requestData.target
                  ?.targetProductGtin ||
                itemData.targetProductGtin ||
                null,

              productGtins:
                requestData.productGtins ||
                itemData.productGtins ||
                [],

              storeId:
                requestData.storeId ||
                itemData.storeId ||
                null,

              storeName:
                requestData.storeName ||
                itemData.storeName ||
                null,

              location:
                requestData.location ||
                itemData.location ||
                null,

              shopperObjective:
                requestData.shopperObjective ||
                null,

              productName:
                requestData.productName ||
                requestData.target
                  ?.targetProductName ||
                null,

              redirectUrl:
                itemData.finalRedirectUrl ||
                '',

              trackingUrl:
                updateData.trackingUrl,

              storagePath:
                updateData.storagePath,

              signedUrl:
                updateData.signedUrl,

              status: 'ACTIVE',

              isGs1Compliant:
                requestData.isGs1Compliant ??
                true,

              dataStatus:
                requestData.dataStatus ||
                'VERIFIED',

              options:
                requestData.options ||
                {},

              updatedAt:
                admin.firestore.FieldValue.serverTimestamp(),

              expiresAt:
                requestData.options?.expiresAt
                  ? new Date(
                      requestData.options.expiresAt
                    )
                  : null,
            },
            { merge: true }
          );

          await batch.commit();
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unknown retry error';

          await itemDoc.ref.update({
            error: message,
            retryCount:
              admin.firestore.FieldValue.increment(
                1
              ),
            updatedAt:
              admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    }

    /*
     * ============================================================
     * 3. RESPONSE
     * ============================================================
     */

    const messages: string[] = [];

    if (itemsProcessedCount > 0) {
      messages.push(
        `Processed ${itemsProcessedCount} activation item(s) for request ${processedRequestId}.`
      );
    }

    if (itemsRetriedCount > 0) {
      messages.push(
        `Retried ${itemsRetriedCount} errored activation item(s).`
      );
    }

    if (messages.length === 0) {
      messages.push(
        'No new or errored activation items to process.'
      );
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
