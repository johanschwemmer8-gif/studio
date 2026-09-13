'use server';

/**
 * @fileOverview Submit canonical Bulk Activation work.
 *
 * ARCHITECTURE:
 * - bulkQrRequests is a technical orchestration envelope only.
 * - One child item represents one canonical Activation work item.
 * - Each work item may contain one or more Deployment intents.
 * - No Activation, Deployment, QR identity, or tracking URL is created here.
 * - Canonical business records are created later by the queue processor.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import {
  SubmitBulkQrRequestInputSchema,
  type SubmitBulkQrRequestInput,
} from '@/lib/schemas/bulk-qr-request';

export type { SubmitBulkQrRequestInput } from '@/lib/schemas/bulk-qr-request';

const SubmitBulkQrRequestOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.string(),
});

export type SubmitBulkQrRequestOutput = z.infer<
  typeof SubmitBulkQrRequestOutputSchema
>;

const ITEM_BATCH_SIZE = 400;

export async function submitBulkQrRequest(
  input: SubmitBulkQrRequestInput
): Promise<SubmitBulkQrRequestOutput> {
  return submitBulkQrRequestFlow(input);
}

const submitBulkQrRequestFlow = ai.defineFlow(
  {
    name: 'submitBulkQrRequestFlow',
    inputSchema: SubmitBulkQrRequestInputSchema,
    outputSchema: SubmitBulkQrRequestOutputSchema,
  },
  async (data) => {
    // -------------------------------------------------------------------------
    // 1. AUTHENTICATION / AUTHORISATION
    // -------------------------------------------------------------------------
    const actor = await verifyAuth(data.idToken);

    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    requireCapability(actor.role, 'ACTIVATION_CREATE');

    if (!db) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    // -------------------------------------------------------------------------
    // 2. CREATE TECHNICAL REQUEST ENVELOPE
    // -------------------------------------------------------------------------
    const requestRef = db.collection('bulkQrRequests').doc();
    const now = new Date();

    try {
      await requestRef.set({
        retailerId: authorizedRetailerId,
        submittedBy: actor.uid,
        totalRequested: data.items.length,
        itemsDone: 0,
        status: 'SUBMITTING',
        createdAt: now,
        updatedAt: now,
      });

      // -----------------------------------------------------------------------
      // 3. CREATE ONE TECHNICAL ITEM PER CANONICAL ACTIVATION WORK ITEM
      // -----------------------------------------------------------------------
      //
      // Firestore write batches are deliberately bounded. The public request
      // schema may contain thousands of work items, so a single batch would
      // exceed Firestore's batch-write limit.
      const itemsCollection = requestRef.collection('items');

      for (
        let offset = 0;
        offset < data.items.length;
        offset += ITEM_BATCH_SIZE
      ) {
        const batch = db.batch();
        const chunk = data.items.slice(offset, offset + ITEM_BATCH_SIZE);

        for (const workItem of chunk) {
          const itemRef = itemsCollection.doc();

          batch.set(itemRef, {
            itemId: itemRef.id,
            requestId: requestRef.id,
            retailerId: authorizedRetailerId,

            activation: workItem.activation,
            deployments: workItem.deployments,

            status: 'PENDING',
            retryCount: 0,
            error: null,

            activationId: null,
            deploymentIds: [],
            qrCodeIds: [],

            createdAt: now,
            updatedAt: now,
          });
        }

        await batch.commit();
      }

      // -----------------------------------------------------------------------
      // 4. QUEUE ONLY AFTER EVERY ITEM HAS BEEN PERSISTED
      // -----------------------------------------------------------------------
      await requestRef.update({
        status: 'QUEUED',
        updatedAt: new Date(),
      });

      console.log(
        `[QR Management] Bulk Activation request queued: ${requestRef.id} for Tenant ${authorizedRetailerId}`
      );

      return {
        success: true,
        requestId: requestRef.id,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown persistence error';

      try {
        await requestRef.set(
          {
            retailerId: authorizedRetailerId,
            totalRequested: data.items.length,
            itemsDone: 0,
            status: 'FAILED',
            error: message,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      } catch (statusError) {
        console.error(
          '[QR Management] Failed to record bulk submission failure:',
          statusError
        );
      }

      console.error(
        '[QR Management] Bulk Activation submission failure:',
        message
      );

      throw new Error('Failed to submit Bulk Activation request.');
    }
  }
);
