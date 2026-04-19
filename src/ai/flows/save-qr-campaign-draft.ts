'use server';
/**
 * @fileOverview A Genkit flow to save a bulk QR code generation request as a draft.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db, admin } from '@/lib/firebase-admin';
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
    if (!db) {
        throw new Error('Firestore is not initialized.');
    }
    
    // In a real function, you'd get auth context here.
    const createdBy = 'simulated-user@example.com';
    const callerRetailerId = 'simulated-retailer-id';

    // In a production app, you would perform this authorization check.
    // if (callerRetailerId !== data.retailerId) {
    //   throw new Error('User is not authorized to create requests for this retailer.');
    // }

    const requestRef = db.collection('bulkQrRequests').doc();
    
    const draftData = {
        ...data,
        totalRequested: data.count,
        status: 'DRAFT', // Saving as a draft
        itemsDone: 0, // Initialize itemsDone for drafts
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: createdBy,
    };
    
    await requestRef.set(draftData);

    return { 
        success: true, 
        requestId: requestRef.id, 
        message: "Campaign saved as draft." 
    };
  }
);
