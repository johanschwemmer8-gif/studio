
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
  itemsRetried: z.number().optional(),
});
export type ProcessBulkQrQueueOutput = z.infer<typeof ProcessBulkQrQueueOutputSchema>;

// The main exported function to be called
export async function processBulkQrQueue(): Promise<ProcessBulkQrQueueOutput> {
  return processBulkQrQueueFlow();
}

const generateQrForItem = (item: any, requestData: any) => {
    const { qrCodeId } = item;
    const qrOptions = requestData.options || {};
    const qrColor = qrOptions.colorHex ? qrOptions.colorHex.replace('#', '') : '000000';
    const qrBgColor = qrOptions.bgColorHex ? qrOptions.bgColorHex.replace('#', '') : 'ffffff';
    const qrError = qrOptions.logoPath ? 'H' : (qrOptions.errorCorrection || 'M');

    const qrData = `${requestData.baseRedirect}?qr=${qrCodeId}`;
    const encodedQrData = encodeURIComponent(qrData);

    let generatedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodedQrData}&color=${qrColor}&bgcolor=${qrBgColor}&ecc=${qrError}`;

    if (qrOptions.logoPath) {
        generatedQrUrl += `&logo=${encodeURIComponent(qrOptions.logoPath)}`;
    }
    
    const storagePath = `qr/${requestData.retailerId}/${requestData.campaignId}/${qrCodeId}.png`;

    return {
        status: 'DONE',
        redirectUrl: qrData,
        storagePath: storagePath,
        signedUrl: generatedQrUrl,
        checksum: '', // Placeholder
        error: admin.firestore.FieldValue.delete(), // Clear previous error
    };
};


const processBulkQrQueueFlow = ai.defineFlow(
  {
    name: 'processBulkQrQueueFlow',
    outputSchema: ProcessBulkQrQueueOutputSchema,
  },
  async () => {
    if (!db) {
      throw new Error('Firestore is not initialized.');
    }

    let itemsProcessedCount = 0;
    let itemsRetriedCount = 0;
    let processedRequestId: string | undefined = undefined;

    // --- 1. Process PENDING items from a QUEUED request ---
    const requestsRef = db.collection('bulkQrRequests');
    const queuedRequestQuery = requestsRef.where('status', '==', 'QUEUED').limit(1);
    const queuedSnapshot = await queuedRequestQuery.get();

    if (!queuedSnapshot.empty) {
        const requestDoc = queuedSnapshot.docs[0];
        processedRequestId = requestDoc.id;

        try {
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

            if (!pendingItemsSnapshot.empty) {
                itemsProcessedCount = pendingItemsSnapshot.size;
                const batch = db.batch();
                for (const itemDoc of pendingItemsSnapshot.docs) {
                    const updateData = generateQrForItem(itemDoc.data(), requestData);
                    batch.update(itemDoc.ref, updateData);
                }
                await batch.commit();
            }

            const allItemsSnapshot = await itemsRef.get();
            const allItemsDone = allItemsSnapshot.docs.every(doc => doc.data().status === 'DONE');
            if (allItemsDone) {
                await requestDoc.ref.update({ status: 'COMPLETED', updatedAt: new Date() });
            }

        } catch (error: any) {
            if (processedRequestId) {
                await requestsRef.doc(processedRequestId).update({
                    status: 'FAILED',
                    error: error.message,
                    updatedAt: new Date()
                });
            }
            console.error(`Failed to process request ${processedRequestId}:`, error);
            // Continue to retry logic even if main processing fails
        }
    }
    
    // --- 2. Process ERRORED items in retry mode ---
    const erroredItemsQuery = db.collectionGroup('items')
                                .where('status', '==', 'ERROR')
                                .where('retryCount', '<', 3)
                                .limit(50);
                                
    const erroredItemsSnapshot = await erroredItemsQuery.get();
    
    if (!erroredItemsSnapshot.empty) {
        itemsRetriedCount = erroredItemsSnapshot.size;
        for (const itemDoc of erroredItemsSnapshot.docs) {
            const itemData = itemDoc.data();
            const requestRef = itemDoc.ref.parent.parent; // items -> {requestId} -> bulkQrRequests
            if (!requestRef) continue;

            const requestDoc = await requestRef.get();
            if (!requestDoc.exists) continue;

            const requestData = requestDoc.data()!;
            
            try {
                const updateData = generateQrForItem(itemData, requestData);
                await itemDoc.ref.update({
                    ...updateData,
                    retryCount: admin.firestore.FieldValue.increment(1)
                });
            } catch (error: any) {
                await itemDoc.ref.update({
                    error: error.message,
                    retryCount: admin.firestore.FieldValue.increment(1)
                });
            }
        }
    }
    
    const messages = [];
    if (itemsProcessedCount > 0) messages.push(`Processed ${itemsProcessedCount} items for request ${processedRequestId}.`);
    if (itemsRetriedCount > 0) messages.push(`Retried ${itemsRetriedCount} errored items.`);
    if (messages.length === 0) messages.push('No new or errored items to process.');

    return {
      success: true,
      message: messages.join(' '),
      processedRequestId,
      itemsProcessed: itemsProcessedCount,
      itemsRetried: itemsRetriedCount,
    };
  }
);

    