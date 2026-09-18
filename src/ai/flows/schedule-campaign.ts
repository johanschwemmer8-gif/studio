'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { requireCampaignTransition } from '@/lib/campaign-lifecycle';
import { CampaignSchema } from '@/lib/schemas/campaign';
import {
  ScheduleCampaignInputSchema,
  type ScheduleCampaignInput,
} from '@/lib/schemas/campaign-command';

const ScheduleCampaignOutputSchema = z.object({
  success: z.boolean(),
  campaignId: z.string(),
  status: z.enum(['SCHEDULED', 'ACTIVE']),
});

function timestampToMillis(value: {
  seconds: number;
  nanoseconds: number;
}): number {
  return value.seconds * 1000 + Math.floor(value.nanoseconds / 1_000_000);
}

export type ScheduleCampaignOutput = z.infer<
  typeof ScheduleCampaignOutputSchema
>;

export async function scheduleCampaign(
  input: ScheduleCampaignInput
): Promise<ScheduleCampaignOutput> {
  return scheduleCampaignFlow(input);
}

const scheduleCampaignFlow = ai.defineFlow(
  {
    name: 'scheduleCampaignFlow',
    inputSchema: ScheduleCampaignInputSchema,
    outputSchema: ScheduleCampaignOutputSchema,
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
    const campaignSnapshot = await campaignRef.get();

    if (!campaignSnapshot.exists) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    const rawCampaign = campaignSnapshot.data();

    if (!rawCampaign) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    const existingCampaign = CampaignSchema.parse(rawCampaign);

    if (existingCampaign.retailerId !== authorizedRetailerId) {
      throw new Error(
        'ACCESS_DENIED: Campaign does not belong to the authorized retailer.'
      );
    }

    const startAt = admin.firestore.Timestamp.fromDate(
      new Date(data.startAt)
    );

    const endAt =
      data.endAt !== undefined
        ? admin.firestore.Timestamp.fromDate(new Date(data.endAt))
        : existingCampaign.endAt;

    if (
      endAt !== undefined &&
      timestampToMillis(endAt) < startAt.toMillis()
    ) {
      throw new Error(
        'INVALID_CAMPAIGN_SCHEDULE: endAt must be greater than or equal to startAt.'
      );
    }

    const now = admin.firestore.Timestamp.now();

    if (
      endAt !== undefined &&
      timestampToMillis(endAt) < now.toMillis()
    ) {
      throw new Error(
        'INVALID_CAMPAIGN_SCHEDULE: Campaign cannot be scheduled with an endAt in the past.'
      );
    }

    const nextStatus: 'SCHEDULED' | 'ACTIVE' =
      startAt.toMillis() <= now.toMillis()
        ? 'ACTIVE'
        : 'SCHEDULED';

    requireCampaignTransition(existingCampaign.status, nextStatus);

    const candidateCampaign = {
      ...existingCampaign,
      status: nextStatus,
      startAt,
      endAt,
      timezone:
        data.timezone !== undefined
          ? data.timezone
          : existingCampaign.timezone,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    CampaignSchema.parse(candidateCampaign);

    const updateData: Record<string, unknown> = {
      status: candidateCampaign.status,
      startAt: candidateCampaign.startAt,
      updatedAt: candidateCampaign.updatedAt,
      updatedBy: candidateCampaign.updatedBy,
    };

    if (candidateCampaign.endAt !== undefined) {
      updateData.endAt = candidateCampaign.endAt;
    }

    if (candidateCampaign.timezone !== undefined) {
      updateData.timezone = candidateCampaign.timezone;
    }

    await campaignRef.update(updateData);

    return {
      success: true,
      campaignId: data.campaignId,
      status: nextStatus,
    };
  }
);
