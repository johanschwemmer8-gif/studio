'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { requireCampaignTransition } from '@/lib/campaign-lifecycle';
import { CampaignSchema } from '@/lib/schemas/campaign';
import {
  PauseCampaignInputSchema,
  type PauseCampaignInput,
} from '@/lib/schemas/campaign-command';

const PauseCampaignOutputSchema = z.object({
  success: z.boolean(),
  campaignId: z.string(),
  status: z.literal('PAUSED'),
});

export type PauseCampaignOutput = z.infer<
  typeof PauseCampaignOutputSchema
>;

export async function pauseCampaign(
  input: PauseCampaignInput
): Promise<PauseCampaignOutput> {
  return pauseCampaignFlow(input);
}

const pauseCampaignFlow = ai.defineFlow(
  {
    name: 'pauseCampaignFlow',
    inputSchema: PauseCampaignInputSchema,
    outputSchema: PauseCampaignOutputSchema,
  },
  async (data) => {
    const actor = await verifyAuth(data.idToken);

    if ('error' in actor) {
      throw new Error(actor.error);
    }

    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    requireCapability(actor.role, 'CAMPAIGN_UPDATE');

    if (!db) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const campaignRef = db.collection('campaigns').doc(data.campaignId);
    const snapshot = await campaignRef.get();

    if (!snapshot.exists) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    const rawCampaign = snapshot.data();

    if (!rawCampaign) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    const existingCampaign = CampaignSchema.parse(rawCampaign);

    if (existingCampaign.retailerId !== authorizedRetailerId) {
      throw new Error(
        'ACCESS_DENIED: Campaign does not belong to the authorized retailer.'
      );
    }

    requireCampaignTransition(existingCampaign.status, 'PAUSED');

    const now = admin.firestore.Timestamp.now();

    const candidateCampaign = {
      ...existingCampaign,
      status: 'PAUSED' as const,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    CampaignSchema.parse(candidateCampaign);

    await campaignRef.update({
      status: candidateCampaign.status,
      updatedAt: candidateCampaign.updatedAt,
      updatedBy: candidateCampaign.updatedBy,
    });

    return {
      success: true,
      campaignId: data.campaignId,
      status: 'PAUSED' as const,
    };
  }
);
