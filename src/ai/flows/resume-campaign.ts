'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { requireCampaignTransition } from '@/lib/campaign-lifecycle';
import { CampaignSchema } from '@/lib/schemas/campaign';
import {
  ResumeCampaignInputSchema,
  type ResumeCampaignInput,
} from '@/lib/schemas/campaign-command';

const ResumeCampaignOutputSchema = z.object({
  success: z.boolean(),
  campaignId: z.string(),
  status: z.literal('ACTIVE'),
});

export type ResumeCampaignOutput = z.infer<
  typeof ResumeCampaignOutputSchema
>;

function timestampToMillis(value: {
  seconds: number;
  nanoseconds: number;
}): number {
  return value.seconds * 1000 + Math.floor(value.nanoseconds / 1_000_000);
}

export async function resumeCampaign(
  input: ResumeCampaignInput
): Promise<ResumeCampaignOutput> {
  return resumeCampaignFlow(input);
}

const resumeCampaignFlow = ai.defineFlow(
  {
    name: 'resumeCampaignFlow',
    inputSchema: ResumeCampaignInputSchema,
    outputSchema: ResumeCampaignOutputSchema,
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

    requireCampaignTransition(existingCampaign.status, 'ACTIVE');

    const now = admin.firestore.Timestamp.now();
    const nowMillis = now.toMillis();

    if (
      existingCampaign.startAt !== undefined &&
      timestampToMillis(existingCampaign.startAt) > nowMillis
    ) {
      throw new Error(
        'CAMPAIGN_NOT_STARTED: Campaign cannot resume before startAt.'
      );
    }

    if (
      existingCampaign.endAt !== undefined &&
      timestampToMillis(existingCampaign.endAt) < nowMillis
    ) {
      throw new Error(
        'CAMPAIGN_ENDED: Campaign cannot resume after endAt.'
      );
    }

    const candidateCampaign = {
      ...existingCampaign,
      status: 'ACTIVE' as const,
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
      status: 'ACTIVE' as const,
    };
  }
);
