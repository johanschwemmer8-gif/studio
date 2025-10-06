
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
  // In a real Firebase Callable Function, you would extract the retailerId from the auth context.
  // This is a placeholder and should be replaced with actual authentication.
  const callerRetailerId = 'simulated-retailer-id';
  
  return deleteBulkQrRequestFlow({ ...input, callerRetailerId });
}

// This flow now requires the caller's ID for authorization.
const deleteBulkQrRequestFlow = ai.defineFlow(
  {
    name: 'deleteBulkQrRequestFlow',
    inputSchema: DeleteBulkQrRequestInputSchema.extend({ 
        // In production, this ID should be extracted from a verified Firebase Auth ID token.
        callerRetailerId: z.string().describe("The retailer ID of the user making the request."),
    }),
    outputSchema: DeleteBulkQrRequestOutputSchema,
  },
  async ({ requestId, callerRetailerId }) => {
    const db = admin.firestore();
    const requestRef = db.collection('bulkQrRequests').doc(requestId);
    
    try {
      const requestDoc = await requestRef.get();
      if (!requestDoc.exists) {
        throw new Error('Request not found.');
      }
      
      const requestData = requestDoc.data();
      
      // **Security Enhancement**: Authorize the delete operation.
      // This check ensures that only a user belonging to the correct retailer can delete the request.
      if (requestData?.retailerId !== callerRetailerId) {
        throw new Error('You are not authorized to delete this request.');
      }
      
      // In a real, high-volume application, this would be done via a batched
      // background job to avoid timeouts and memory issues.
      const itemsRef = requestRef.collection('items');
      const itemsSnapshot = await itemsRef.get();
      const batch = db.batch();
      
      itemsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();

      await requestRef.delete();
      
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
