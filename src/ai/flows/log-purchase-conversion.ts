
'use server';
/**
 * @fileOverview A Genkit flow to log a purchase conversion event from Analytics.
 *
 * - logPurchaseConversion - Updates a campaign's conversion and revenue in Firestore.
 * - LogPurchaseConversionInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const LogPurchaseConversionInputSchema = z.object({
  productSku: z.string().describe("The SKU of the product that was purchased."),
  transactionRevenue: z.number().describe("The revenue generated from this transaction."),
});
export type LogPurchaseConversionInput = z.infer<typeof LogPurchaseConversionInputSchema>;

export async function logPurchaseConversion(input: LogPurchaseConversionInput): Promise<{ success: boolean; message: string }> {
  // In a real Firebase environment, this could be triggered by an Analytics event.
  return logPurchaseConversionFlow(input);
}

const logPurchaseConversionFlow = ai.defineFlow(
  {
    name: 'logPurchaseConversionFlow',
    inputSchema: LogPurchaseConversionInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async ({ productSku, transactionRevenue }) => {
    const db = admin.firestore();
    const campaignsRef = db.collection('adCampaigns');

    // Find the campaign that sponsors this product.
    // We only consider 'Running' campaigns.
    const q = campaignsRef
      .where('status', '==', 'Running')
      .where('sponsoredProducts', 'array-contains', productSku)
      .limit(1);

    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      const message = `No active campaign found sponsoring product SKU: ${productSku}. No conversion logged.`;
      console.log(message);
      return { success: false, message };
    }

    const campaignDoc = querySnapshot.docs[0];
    const campaignRef = campaignDoc.ref;
    const campaignId = campaignDoc.id;

    try {
      // Use a transaction to safely update the campaign document.
      await db.runTransaction(async (transaction) => {
        const campaignSnapshot = await transaction.get(campaignRef);
        if (!campaignSnapshot.exists) {
            throw new Error(`Campaign with ID ${campaignId} not found during transaction.`);
        }

        // Atomically increment the conversions and total revenue.
        transaction.update(campaignRef, {
          conversions: admin.firestore.FieldValue.increment(1),
          totalRevenue: admin.firestore.FieldValue.increment(transactionRevenue),
        });
      });
      
      const successMessage = `Successfully logged purchase for SKU ${productSku} against campaign ${campaignId}.`;
      console.log(successMessage);
      return { success: true, message: successMessage };

    } catch (error: any) {
      const errorMessage = `Failed to log purchase for campaign ${campaignId}: ${error.message}`;
      console.error(errorMessage);
      throw error;
    }
  }
);
