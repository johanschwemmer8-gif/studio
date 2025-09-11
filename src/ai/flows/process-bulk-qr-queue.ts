
'use server';
/**
 * @fileOverview A Genkit flow to process queued bulk QR code generation requests.
 *
 * - processBulkQrQueue - A flow that simulates a Cloud Function to process one request from the queue.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// Output schema for the flow
const ProcessBulkQrQueueOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  processedRequestId: z.string().optional(),
  itemsProcessed: z.number().optional(),
});
export type ProcessBulkQrQueueOutput = z.infer<typeof ProcessBulkQrQueueOutputSchema>;

// The main exported function to be called
export async function processBulkQrQueue(): Promise<ProcessBulkQrQueueOutput> {
  return processBulkQrQueueFlow();
}

const processBulkQrQueueFlow = ai.defineFlow(
  {
    name: 'processBulkQrQueueFlow',
    outputSchema: ProcessBulkQrQueueOutputSchema,
  },
  async () => {
    if (!db) {
      throw new Error('Firestore is not initialized.');
    }

    const requestsRef = db.collection('bulkQrRequests');
    // Find a request that is currently queued
    const query = requestsRef.where('status', '==', 'QUEUED').limit(1);
    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
      return { success: true, message: 'No queued requests to process.' };
    }

    const requestDoc = querySnapshot.docs[0];
    const requestId = requestDoc.id;

    let itemsProcessedCount = 0;

    try {
      // Use a transaction to atomically lock the request
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(requestDoc.ref);
        if (doc.data()?.status !== 'QUEUED') {
          throw new Error('Request was locked by another process.');
        }
        transaction.update(requestDoc.ref, { 
            status: 'PROCESSING',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      const requestData = requestDoc.data();
      const itemsRef = requestDoc.ref.collection('items');
      const pendingItemsQuery = itemsRef.where('status', '==', 'PENDING').limit(100);
      const pendingItemsSnapshot = await pendingItemsQuery.get();
      
      if (pendingItemsSnapshot.empty) {
         await requestDoc.ref.update({ status: 'COMPLETED', updatedAt: new Date() });
         return { success: true, message: `Request ${requestId} had no pending items. Marked as COMPLETED.`, processedRequestId: requestId, itemsProcessed: 0 };
      }

      itemsProcessedCount = pendingItemsSnapshot.size;
      const batch = db.batch();

      for (const itemDoc of pendingItemsSnapshot.docs) {
        const item = itemDoc.data();
        const { qrCodeId, index } = item;

        // Construct QR code URL with options
        const qrOptions = requestData.options || {};
        const qrColor = qrOptions.colorHex ? qrOptions.colorHex.replace('#', '') : '000000';
        const qrBgColor = qrOptions.bgColorHex ? qrOptions.bgColorHex.replace('#', '') : 'ffffff';
        const qrError = qrOptions.errorCorrection || 'M';

        const qrData = `${requestData.baseRedirect}?qr=${qrCodeId}`;
        const encodedQrData = encodeURIComponent(qrData);
        
        // This URL simulates generating and getting a public URL. In a real scenario, we'd upload to GCS.
        const generatedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodedQrData}&color=${qrColor}&bgcolor=${qrBgColor}&ecc=${qrError}`;

        const storagePath = `qr/${requestData.retailerId}/${requestData.campaignId}/${qrCodeId}.png`;

        batch.update(itemDoc.ref, {
          status: 'DONE',
          redirectUrl: qrData,
          storagePath: storagePath,
          signedUrl: generatedQrUrl, // Using the public URL as a stand-in for a signed URL
          checksum: '', // Placeholder for MD5 hash
        });
      }
      
      await batch.commit();

      // Check if all items are now done
      const allItemsSnapshot = await itemsRef.get();
      const allItemsDone = allItemsSnapshot.docs.every(doc => doc.data().status === 'DONE');
      
      if (allItemsDone) {
        await requestDoc.ref.update({ status: 'COMPLETED', updatedAt: new Date() });
      }

      return { success: true, message: `Successfully processed ${itemsProcessedCount} items for request ${requestId}.`, processedRequestId: requestId, itemsProcessed: itemsProcessedCount };

    } catch (error: any) {
        if (requestId) {
            await requestsRef.doc(requestId).update({
                status: 'FAILED',
                error: error.message,
                updatedAt: new Date()
            });
        }
        console.error(`Failed to process request ${requestId}:`, error);
        return { success: false, message: `Failed to process request ${requestId}: ${error.message}`, processedRequestId: requestId };
    }
  }
);
