'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { CampaignSchema } from '@/lib/schemas/campaign';
import {
  CreateCampaignInputSchema,
  type CreateCampaignInput,
} from '@/lib/schemas/campaign-command';

const CreateCampaignOutputSchema = z.object({
  success: z.boolean(),
  campaignId: z.string(),
});

export type CreateCampaignOutput = z.infer<typeof CreateCampaignOutputSchema>;

export async function createCampaign(
  input: CreateCampaignInput
): Promise<CreateCampaignOutput> {
  return createCampaignFlow(input);
}

const createCampaignFlow = ai.defineFlow(
  {
    name: 'createCampaignFlow',
    inputSchema: CreateCampaignInputSchema,
    outputSchema: CreateCampaignOutputSchema,
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

    requireCapability(actor.role, 'CAMPAIGN_CREATE');

    if (!db) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const campaignRef = db.collection('campaigns').doc();
    const now = admin.firestore.Timestamp.now();

    const startAt = data.startAt
      ? admin.firestore.Timestamp.fromDate(new Date(data.startAt))
      : undefined;

    const endAt = data.endAt
      ? admin.firestore.Timestamp.fromDate(new Date(data.endAt))
      : undefined;

    if (startAt && endAt && endAt.toMillis() < startAt.toMillis()) {
      throw new Error('INVALID_CAMPAIGN_SCHEDULE: endAt cannot be before startAt.');
    }

    const campaignData = {
      campaignId: campaignRef.id,
      retailerId: authorizedRetailerId,
      name: data.name,
      description: data.description,
      purpose: data.purpose,
      objective: data.objective,
      status: 'DRAFT' as const,
      startAt,
      endAt,
      timezone: data.timezone,
      createdAt: now,
      createdBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    CampaignSchema.parse(campaignData);

    await campaignRef.set(campaignData);

    return {
      success: true,
      campaignId: campaignRef.id,
    };
  }
);
