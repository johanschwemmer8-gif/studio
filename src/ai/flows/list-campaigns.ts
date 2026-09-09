'use server';
/**
 * @fileOverview List QR Campaigns for a retailer (used to populate
 * the Campaign picker in the Activation and Bulk Generator UI).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';
import { CampaignSchema } from '@/lib/schemas/campaign';

const ListCampaignsInputSchema = z.object({
  idToken: z.string(),
  retailerId: z.string(),
});

const ListCampaignsOutputSchema = z.object({
  campaigns: z.array(CampaignSchema),
});

export type ListCampaignsOutput = z.infer<typeof ListCampaignsOutputSchema>;

export async function listCampaigns(
  input: z.infer<typeof ListCampaignsInputSchema>
): Promise<ListCampaignsOutput> {
  return listCampaignsFlow(input);
}

const listCampaignsFlow = ai.defineFlow(
  {
    name: 'listCampaignsFlow',
    inputSchema: ListCampaignsInputSchema,
    outputSchema: ListCampaignsOutputSchema,
  },
  async (data) => {
    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    if (!db) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const snapshot = await db
      .collection('campaigns')
      .where('retailerId', '==', authorizedRetailerId)
      .orderBy('createdAt', 'desc')
      .get();

    const campaigns = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        campaignId: d.campaignId,
        retailerId: d.retailerId,
        campaignName: d.campaignName,
        campaignType: d.campaignType,
        campaignMode: d.campaignMode,
        target: d.target || null,
        status: d.status,
        startDate: d.startDate || null,
        endDate: d.endDate || null,
        createdBy: d.createdBy,
      };
    });

    return { campaigns };
  }
);