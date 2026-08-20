'use server';
/**
 * @fileOverview A Genkit flow to save a bulk QR code generation request as a draft.
 * Authenticated & Scoped to the caller's retailerId.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db, admin } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';
import { SubmitBulkQrRequestInputSchema } from './submit-bulk-qr-request';

const SaveQrCampaignDraftOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.string(),
  message: z.string(),
});
export type SaveQrCampaignDraftOutput = z.infer<typeof SaveQrCampaignDraftOutputSchema>;

export async function saveQrCampaignDraft(input: z.infer<typeof SubmitBulkQrRequestInputSchema>): Promise<SaveQrCampaignDraftOutput> {
    return saveQrCampaignDraftFlow(input);
}

const saveQrCampaignDraftFlow = ai.defineFlow(
  {
    name: 'saveQrCampaignDraftFlow',
    inputSchema: SubmitBulkQrRequestInputSchema,
    outputSchema: SaveQrCampaignDraftOutputSchema,
  },
  async (data) => {
    // 1. Authorize & Resolve Identity
    const authorizedRetailerId = await getAuthorizedRetailerId(data.idToken, data.retailerId);
    
    if (!db) {
        throw new Error('Infrastructure Layer Unavailable.');
    }

    const requestRef = db.collection('bulkQrRequests').doc();
    
    try {
        await requestRef.set({
            retailerId: authorizedRetailerId,
            brandId: data.brandId,
            campaignId: data.campaignId,
            productName: data.productName || 'Unnamed Product',
            totalRequested: data.count,
            status: 'DRAFT', 
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            options: data.options || {},
            itemsDone: 0,
            isGs1Compliant: true,
            dataStatus: 'VERIFIED'
        });

        return { 
            success: true, 
            requestId: requestRef.id, 
            message: "Campaign saved as draft in cloud." 
        };

    } catch (error: any) {
        console.error(`[QR Management] Draft Persistence Failure:`, error.message);
        throw new Error("Failed to save campaign draft.");
    }
  }
);
