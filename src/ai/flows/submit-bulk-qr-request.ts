'use server';

/**
 * @fileOverview Product-centric QR Activation Flow (Reverted)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db, admin } from '@/lib/firebase-admin';
import { SubmitBulkQrRequestInputSchema } from '@/lib/schemas/bulk-qr-request';

const SubmitBulkQrRequestOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.string(),
});

export async function submitBulkQrRequest(input: z.infer<typeof SubmitBulkQrRequestInputSchema>) {
  return submitBulkQrRequestFlow(input);
}

const submitBulkQrRequestFlow = ai.defineFlow(
  {
    name: 'submitBulkQrRequestFlow',
    inputSchema: SubmitBulkQrRequestInputSchema,
    outputSchema: SubmitBulkQrRequestOutputSchema,
  },
  async (data) => {
    if (!db) {
        throw new Error('Firestore is not initialized.');
    }
    
    const retailerId = data.retailerId;
    const { campaignId, options, count } = data;
    
    const requestRef = db.collection('bulkQrRequests').doc();
    const batch = db.batch();

    const requestData = {
        retailerId,
        campaignId,
        totalRequested: count || 1,
        status: 'QUEUED',
        createdAt: new Date(),
        updatedAt: new Date(),
        options: options || {},
        target: data.target || null,
        productGtins: data.productGtins || [],
        storeId: data.storeId || null,
        storeName: data.storeName || null,
        location: data.location || null,
        productName: data.productName || null,
    };
    batch.set(requestRef, requestData);

    const itemsCollection = requestRef.collection('items');
    for (let i = 0; i < (count || 1); i++) {
        const itemRef = itemsCollection.doc();
        batch.set(itemRef, {
            index: i,
            qrCodeId: itemRef.id,
            retailerId: retailerId,
            status: 'PENDING',
            targetProductGtin: options?.gtin || null,
            productGtins: data.productGtins || [],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    await batch.commit();
    
    return { success: true, requestId: requestRef.id };
  }
);
