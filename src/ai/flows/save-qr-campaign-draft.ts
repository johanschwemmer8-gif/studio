'use server';
/**
 * @fileOverview A Genkit flow to save a bulk QR code generation request as a draft.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
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
    // This is also mocked for now to avoid auth issues.
    console.log(`(Simulation) QR Campaign Draft saved for campaign: ${data.campaignId}.`);
    const mockRequestId = `draft_req_${Date.now()}`;
    return { success: true, requestId: mockRequestId, message: "Campaign saved as draft." };
  }
);
