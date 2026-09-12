'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { CampaignSchema } from '@/lib/schemas/campaign';
import {
  UpdateCampaignInputSchema,
  type UpdateCampaignInput,
} from '@/lib/schemas/campaign-command';

const UpdateCampaignOutputSchema = z.object({
  success: z.boolean(),
  campaignId: z.string(),
});

export type UpdateCampaignOutput = z.infer<typeof UpdateCampaignOutputSchema>;

export async function updateCampaign(
  input: UpdateCampaignInput
): Promise<UpdateCampaignOutput> {
  return updateCampaignFlow(input);
}

const updateCampaignFlow = ai.defineFlow(
  {
    name: 'updateCampaignFlow',
    inputSchema: UpdateCampaignInputSchema,
    outputSchema: UpdateCampaignOutputSchema,
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

    requireCapability(actor.role, 'CAMPAIGN_UPDATE');

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
      throw new Error('CAMPAIGN_ARCHIVED: Archived Campaigns cannot be updated.');
    }

    const now = admin.firestore.Timestamp.now();

    const startAt = data.startAt !== undefined
      ? admin.firestore.Timestamp.fromDate(new Date(data.startAt))
      : existingCampaign.startAt;

    const endAt = data.endAt !== undefined
      ? admin.firestore.Timestamp.fromDate(new Date(data.endAt))
      : existingCampaign.endAt;

    if (startAt && endAt && endAt.toMillis() < startAt.toMillis()) {
      throw new Error('INVALID_CAMPAIGN_SCHEDULE: endAt cannot be before startAt.');
    }

    const candidateCampaign = {
      ...existingCampaign,
      name: data.name !== undefined ? data.name : existingCampaign.name,
      description: data.description !== undefined
        ? data.description
        : existingCampaign.description,
      purpose: data.purpose !== undefined
        ? data.purpose
        : existingCampaign.purpose,
      objective: data.objective !== undefined
        ? data.objective
        : existingCampaign.objective,
      startAt,
      endAt,
      timezone: data.timezone !== undefined
        ? data.timezone
        : existingCampaign.timezone,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    CampaignSchema.parse(candidateCampaign);

    const updateData: Record<string, unknown> = {
      updatedAt: candidateCampaign.updatedAt,
      updatedBy: candidateCampaign.updatedBy,
    };

    if (data.name !== undefined) updateData.name = candidateCampaign.name;
    if (data.description !== undefined) updateData.description = candidateCampaign.description;
    if (data.purpose !== undefined) updateData.purpose = candidateCampaign.purpose;
    if (data.objective !== undefined) updateData.objective = candidateCampaign.objective;
    if (data.startAt !== undefined) updateData.startAt = candidateCampaign.startAt;
    if (data.endAt !== undefined) updateData.endAt = candidateCampaign.endAt;
    if (data.timezone !== undefined) updateData.timezone = candidateCampaign.timezone;

    await campaignRef.update(updateData);

    return {
      success: true,
      campaignId: data.campaignId,
    };
  }
);
