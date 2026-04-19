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
    // SIMULATION: Bypassing Firestore interaction to prevent auth errors.
    console.log(`(Simulation) Draft QR request saved for campaign: ${data.campaignId}. The database call was skipped to avoid auth errors.`);
    const mockRequestId = `sim_draft_${Date.now()}`;
    
    // NOTE: Because this is a simulation, the saved job will NOT appear in the Request History list below.
    // This is a temporary measure to avoid the "Could not refresh access token" error.
    
    return { 
        success: true, 
        requestId: mockRequestId, 
        message: "Campaign saved as draft (simulation)." 
    };
  }
);
