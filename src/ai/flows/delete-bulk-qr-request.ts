
'use server';
/**
 * @fileOverview A Genkit flow to delete a bulk QR code request and all its associated items.
 *
 * - deleteBulkQrRequest - Deletes a request and its subcollection.
 * - DeleteBulkQrRequestInput - The input type for the flow.
 * - DeleteBulkQrRequestOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const DeleteBulkQrRequestInputSchema = z.object({
  requestId: z.string(),
});
export type DeleteBulkQrRequestInput = z.infer<typeof DeleteBulkQrRequestInputSchema>;

const DeleteBulkQrRequestOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteBulkQrRequestOutput = z.infer<typeof DeleteBulkQrRequestOutputSchema>;

export async function deleteBulkQrRequest(input: DeleteBulkQrRequestInput): Promise<DeleteBulkQrRequestOutput> {
  // In a real environment, you'd add auth/permission checks here.
  return deleteBulkQrRequestFlow(input);
}

const deleteBulkQrRequestFlow = ai.defineFlow(
  {
    name: 'deleteBulkQrRequestFlow',
    inputSchema: DeleteBulkQrRequestInputSchema,
    outputSchema: DeleteBulkQrRequestOutputSchema,
  },
  async ({ requestId }) => {
    const db = admin.firestore();
    const requestRef = db.collection('bulkQrRequests').doc(requestId);
    const itemsRef = requestRef.collection('items');
    
    try {
      // In a real, high-volume application, this would be done via a batched
      // background job to avoid timeouts and memory issues.
      const itemsSnapshot = await itemsRef.get();
      const batch = db.batch();
      
      itemsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();

      await requestRef.delete();
      
      // Also clean up from the mock local storage if it exists
      if (typeof localStorage !== 'undefined') {
        const existingRequests = JSON.parse(localStorage.getItem('mockBulkQrRequests') || '[]');
        const updatedRequests = existingRequests.filter((r: any) => r.id !== requestId);
        localStorage.setItem('mockBulkQrRequests', JSON.stringify(updatedRequests));
      }

      return {
        success: true,
        message: `Successfully deleted request ${requestId} and its ${itemsSnapshot.size} items.`,
      };

    } catch (error: any) {
      console.error(`Failed to delete request ${requestId}:`, error);
      return {
        success: false,
        message: `Failed to delete request: ${error.message}`,
      };
    }
  }
);
