'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { CampaignSchema } from '@/lib/schemas/campaign';
import { ActivationSchema } from '@/lib/schemas/activation';
import {
  CreateActivationInputSchema,
  type CreateActivationInput,
} from '@/lib/schemas/activation-command';

const CreateActivationOutputSchema = z.object({
  success: z.boolean(),
  activationId: z.string(),
});

export type CreateActivationOutput = z.infer<
  typeof CreateActivationOutputSchema
>;

export async function createActivation(
  input: CreateActivationInput
): Promise<CreateActivationOutput> {
  return createActivationFlow(input);
}

const createActivationFlow = ai.defineFlow(
  {
    name: 'createActivationFlow',
    inputSchema: CreateActivationInputSchema,
    outputSchema: CreateActivationOutputSchema,
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

    requireCapability(actor.role, 'ACTIVATION_CREATE');

    if (db == null) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const campaignRef = db.collection('campaigns').doc(data.campaignId);
    const campaignSnapshot = await campaignRef.get();

    if (campaignSnapshot.exists === false) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    const campaignData = campaignSnapshot.data();

    if (campaignData === undefined) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    CampaignSchema.parse(campaignData);

    if (campaignData.retailerId !== authorizedRetailerId) {
      throw new Error(
        'ACCESS_DENIED: Campaign does not belong to the authorized retailer.'
      );
    }

    if (campaignData.status === 'ARCHIVED') {
      throw new Error(
        'CAMPAIGN_ARCHIVED: Activations cannot be created under an archived Campaign.'
      );
    }

    const startAt = data.startAt
      ? admin.firestore.Timestamp.fromDate(new Date(data.startAt))
      : undefined;

    const endAt = data.endAt
      ? admin.firestore.Timestamp.fromDate(new Date(data.endAt))
      : undefined;

    if (startAt && endAt && endAt.toMillis() < startAt.toMillis()) {
      throw new Error(
        'INVALID_ACTIVATION_SCHEDULE: endAt cannot be before startAt.'
      );
    }

    const activationRef = db.collection('activations').doc();
    const now = admin.firestore.Timestamp.now();

    const activationData = {
      activationId: activationRef.id,
      retailerId: authorizedRetailerId,
      campaignId: data.campaignId,
      name: data.name,
      description: data.description,
      target: data.target,
      productContext: data.productContext,
      shopperObjective: data.shopperObjective,
      experienceMode: data.experienceMode,
      experienceConfig: data.experienceConfig,
      advancedInstructions: data.advancedInstructions,
      status: 'DRAFT' as const,
      approvalRequired: data.approvalRequired,
      startAt,
      endAt,
      timezone: data.timezone,
      configurationVersion: 1,
      createdAt: now,
      createdBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    ActivationSchema.parse(activationData);

    await activationRef.set(activationData);

    return {
      success: true,
      activationId: activationRef.id,
    };
  }
);
