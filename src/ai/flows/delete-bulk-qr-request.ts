
'use server';
/**
 * @fileOverview A Genkit flow to delete a bulk QR code request and all its associated items.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-server';
import { hasPermission } from '@/lib/authorization';

if (!admin.apps.length) {
  admin.initializeApp();
}

const DeleteBulkQrRequestInputSchema = z.object({
  requestId: z.string(),
  idToken: z.string().describe("The user's Firebase Authentication ID token for authorization."),
});
export type DeleteBulkQrRequestInput = z.infer<typeof DeleteBulkQrRequestInputSchema>;

const DeleteBulkQrRequestOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteBulkQrRequestOutput = z.infer<typeof DeleteBulkQrRequestOutputSchema>;

export async function deleteBulkQrRequest(input: DeleteBulkQrRequestInput): Promise<DeleteBulkQrRequestOutput> {
  // Authorization is handled inside the flow logic below
  return deleteBulkQrRequestFlow(input);
}

const deleteBulkQrRequestFlow = ai.defineFlow(
  {
    name: 'deleteBulkQrRequestFlow',
    inputSchema: DeleteBulkQrRequestInputSchema,
    outputSchema: DeleteBulkQrRequestOutputSchema,
  },
  async ({ requestId, idToken }) => {
    const auth = await verifyAuth(idToken);
    const db = admin.firestore();
    const requestRef = db.collection('bulkQrRequests').doc(requestId);
    
    try {
      const requestDoc = await requestRef.get();
      if (!requestDoc.exists) {
        throw new Error('Request not found.');
      }
      
      const requestData = requestDoc.data();
      
      // SECURITY GATE: Require authoritative retailer authorization and permission.
      if ('error' in auth) {
        throw new Error(auth.error);
      }

      if (!hasPermission(auth, 'manageOrganization')) {
        throw new Error('You are not authorized to delete bulk QR requests.');
      }

      if (requestData?.retailerId !== auth.retailerId) {
        throw new Error('You are not authorized to delete this request.');
      }
      
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
