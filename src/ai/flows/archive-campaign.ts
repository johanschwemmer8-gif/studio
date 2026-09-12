'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { CampaignSchema } from '@/lib/schemas/campaign';
import {
  ArchiveCampaignInputSchema,
  type ArchiveCampaignInput,
} from '@/lib/schemas/campaign-command';

const ArchiveCampaignOutputSchema = z.object({
  success: z.boolean(),
  campaignId: z.string(),
});

export type ArchiveCampaignOutput = z.infer<typeof ArchiveCampaignOutputSchema>;

export async function archiveCampaign(
  input: ArchiveCampaignInput
): Promise<ArchiveCampaignOutput> {
  return archiveCampaignFlow(input);
}

const archiveCampaignFlow = ai.defineFlow(
  {
    name: 'archiveCampaignFlow',
    inputSchema: ArchiveCampaignInputSchema,
    outputSchema: ArchiveCampaignOutputSchema,
  },
  async (data) => {
    const actor = await verifyAuth(data.idToken);

    if (actor.error) {
      throw new Error(actor.error);
    }

    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    requireCapability(actor.role, 'CAMPAIGN_ARCHIVE');

    if (!db) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const campaignRef = db.collection('campaigns').doc(data.campaignId);
    const campaignSnapshot = await campaignRef.get();

    if (!campaignSnapshot.exists) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    const existingCampaign = campaignSnapshot.data();

    if (!existingCampaign) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    if (existingCampaign.retailerId !== authorizedRetailerId) {
      throw new Error('ACCESS_DENIED: Campaign does not belong to the authorized retailer.');
    }

    if (existingCampaign.status === 'ARCHIVED') {
      return {
        success: true,
        campaignId: data.campaignId,
      };
    }

    const now = admin.firestore.Timestamp.now();

    const candidateCampaign = {
      ...existingCampaign,
      status: 'ARCHIVED' as const,
      archivedAt: now,
      archivedBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    CampaignSchema.parse(candidateCampaign);

    await campaignRef.update({
      status: 'ARCHIVED',
      archivedAt: now,
      archivedBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    });

    return {
      success: true,
      campaignId: data.campaignId,
    };
  }
);
