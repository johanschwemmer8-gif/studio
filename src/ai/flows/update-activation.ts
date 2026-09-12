'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { CampaignSchema } from '@/lib/schemas/campaign';
import { ActivationSchema } from '@/lib/schemas/activation';
import {
  UpdateActivationInputSchema,
  type UpdateActivationInput,
} from '@/lib/schemas/activation-command';

const UpdateActivationOutputSchema = z.object({
  success: z.boolean(),
  activationId: z.string(),
});

export type UpdateActivationOutput = z.infer<
  typeof UpdateActivationOutputSchema
>;

export async function updateActivation(
  input: UpdateActivationInput
): Promise<UpdateActivationOutput> {
  return updateActivationFlow(input);
}

const updateActivationFlow = ai.defineFlow(
  {
    name: 'updateActivationFlow',
    inputSchema: UpdateActivationInputSchema,
    outputSchema: UpdateActivationOutputSchema,
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

    requireCapability(actor.role, 'ACTIVATION_UPDATE');

    if (db == null) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const activationRef = db.collection('activations').doc(data.activationId);
    const activationSnapshot = await activationRef.get();

    if (activationSnapshot.exists === false) {
      throw new Error('ACTIVATION_NOT_FOUND');
    }

    const existingActivation = activationSnapshot.data();

    if (existingActivation === undefined) {
      throw new Error('ACTIVATION_NOT_FOUND');
    }

    ActivationSchema.parse(existingActivation);

    if (existingActivation.retailerId !== authorizedRetailerId) {
      throw new Error(
        'ACCESS_DENIED: Activation does not belong to the authorized retailer.'
      );
    }

    if (
      existingActivation.status !== 'DRAFT' ||
      existingActivation.submittedAt !== undefined
    ) {
      throw new Error(
        'ACTIVATION_NOT_EDITABLE: Activation configuration may only be updated before submission while DRAFT.'
      );
    }

    if (
      data.campaignId !== undefined &&
      data.campaignId !== existingActivation.campaignId
    ) {
      const newCampaignRef = db.collection('campaigns').doc(data.campaignId);
      const newCampaignSnapshot = await newCampaignRef.get();

      if (newCampaignSnapshot.exists === false) {
        throw new Error('CAMPAIGN_NOT_FOUND');
      }

      const newCampaignData = newCampaignSnapshot.data();

      if (newCampaignData === undefined) {
        throw new Error('CAMPAIGN_NOT_FOUND');
      }

      CampaignSchema.parse(newCampaignData);

      if (newCampaignData.retailerId !== authorizedRetailerId) {
        throw new Error(
          'ACCESS_DENIED: Campaign does not belong to the authorized retailer.'
        );
      }

      if (newCampaignData.status === 'ARCHIVED') {
        throw new Error(
          'CAMPAIGN_ARCHIVED: Activation cannot be moved to an archived Campaign.'
        );
      }
    }

    const now = admin.firestore.Timestamp.now();

    const startAt =
      data.startAt !== undefined
        ? admin.firestore.Timestamp.fromDate(new Date(data.startAt))
        : existingActivation.startAt;

    const endAt =
      data.endAt !== undefined
        ? admin.firestore.Timestamp.fromDate(new Date(data.endAt))
        : existingActivation.endAt;

    if (startAt && endAt && endAt.toMillis() < startAt.toMillis()) {
      throw new Error(
        'INVALID_ACTIVATION_SCHEDULE: endAt cannot be before startAt.'
      );
    }

    const candidateActivation = {
      ...existingActivation,
      campaignId:
        data.campaignId !== undefined
          ? data.campaignId
          : existingActivation.campaignId,
      name:
        data.name !== undefined
          ? data.name
          : existingActivation.name,
      description:
        data.description !== undefined
          ? data.description
          : existingActivation.description,
      target:
        data.target !== undefined
          ? data.target
          : existingActivation.target,
      productContext:
        data.productContext !== undefined
          ? data.productContext
          : existingActivation.productContext,
      shopperObjective:
        data.shopperObjective !== undefined
          ? data.shopperObjective
          : existingActivation.shopperObjective,
      experienceMode:
        data.experienceMode !== undefined
          ? data.experienceMode
          : existingActivation.experienceMode,
      experienceConfig:
        data.experienceConfig !== undefined
          ? data.experienceConfig
          : existingActivation.experienceConfig,
      advancedInstructions:
        data.advancedInstructions !== undefined
          ? data.advancedInstructions
          : existingActivation.advancedInstructions,
      approvalRequired:
        data.approvalRequired !== undefined
          ? data.approvalRequired
          : existingActivation.approvalRequired,
      startAt,
      endAt,
      timezone:
        data.timezone !== undefined
          ? data.timezone
          : existingActivation.timezone,
      configurationVersion: existingActivation.configurationVersion + 1,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    ActivationSchema.parse(candidateActivation);

    const updateData: Record<string, unknown> = {
      configurationVersion: candidateActivation.configurationVersion,
      updatedAt: candidateActivation.updatedAt,
      updatedBy: candidateActivation.updatedBy,
    };

    if (data.campaignId !== undefined) {
      updateData.campaignId = candidateActivation.campaignId;
    }

    if (data.name !== undefined) {
      updateData.name = candidateActivation.name;
    }

    if (data.description !== undefined) {
      updateData.description = candidateActivation.description;
    }

    if (data.target !== undefined) {
      updateData.target = candidateActivation.target;
    }

    if (data.productContext !== undefined) {
      updateData.productContext = candidateActivation.productContext;
    }

    if (data.shopperObjective !== undefined) {
      updateData.shopperObjective = candidateActivation.shopperObjective;
    }

    if (data.experienceMode !== undefined) {
      updateData.experienceMode = candidateActivation.experienceMode;
    }

    if (data.experienceConfig !== undefined) {
      updateData.experienceConfig = candidateActivation.experienceConfig;
    }

    if (data.advancedInstructions !== undefined) {
      updateData.advancedInstructions =
        candidateActivation.advancedInstructions;
    }

    if (data.approvalRequired !== undefined) {
      updateData.approvalRequired = candidateActivation.approvalRequired;
    }

    if (data.startAt !== undefined) {
      updateData.startAt = candidateActivation.startAt;
    }

    if (data.endAt !== undefined) {
      updateData.endAt = candidateActivation.endAt;
    }

    if (data.timezone !== undefined) {
      updateData.timezone = candidateActivation.timezone;
    }

    await activationRef.update(updateData);

    return {
      success: true,
      activationId: data.activationId,
    };
  }
);
