
'use server';
/**
 * @fileOverview A Genkit flow to log an ad click event from Analytics.
 *
 * - logAdClick - Updates a campaign's click count in Firestore.
 * - LogAdClickInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const LogAdClickInputSchema = z.object({
  campaignId: z.string().describe("The ID of the ad campaign document in Firestore."),
});
export type LogAdClickInput = z.infer<typeof LogAdClickInputSchema>;

export async function logAdClick(input: LogAdClickInput): Promise<{ success: boolean }> {
  // In a real Firebase environment, this would be an Analytics-triggered function.
  // We simulate it as a callable flow for now.
  return logAdClickFlow(input);
}

const logAdClickFlow = ai.defineFlow(
  {
    name: 'logAdClickFlow',
    inputSchema: LogAdClickInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async ({ campaignId }) => {
    const db = admin.firestore();
    const campaignRef = db.collection('adCampaigns').doc(campaignId);

    try {
      // Use a transaction to safely increment the click count.
      await db.runTransaction(async (transaction) => {
        const campaignDoc = await transaction.get(campaignRef);
        if (!campaignDoc.exists) {
          throw new Error(`Campaign with ID ${campaignId} not found.`);
        }

        // Atomically increment the 'clicks' field by 1.
        transaction.update(campaignRef, {
          clicks: admin.firestore.FieldValue.increment(1),
        });
      });
      
      console.log(`Successfully logged click for campaign ${campaignId}.`);
      return { success: true };

    } catch (error: any) {
      console.error(`Failed to log click for campaign ${campaignId}:`, error.message);
      // Re-throw the error to ensure the flow fails and can be retried if needed.
      throw error;
    }
  }
);
