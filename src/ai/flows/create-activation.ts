'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { createActivationInternal } from '@/lib/activation-internal';
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

      const activationRef = db.collection('activations').doc();

      const result = await createActivationInternal({
        activationId: activationRef.id,
        retailerId: authorizedRetailerId,
        actorUid: actor.uid,
        activation: {
          campaignId: data.campaignId,
          name: data.name,
          description: data.description,
          target: data.target,
          productContext: data.productContext,
          shopperObjective: data.shopperObjective,
          experienceMode: data.experienceMode,
          experienceConfig: data.experienceConfig,
          advancedInstructions: data.advancedInstructions,
          approvalRequired: data.approvalRequired,
          startAt: data.startAt,
          endAt: data.endAt,
          timezone: data.timezone,
        },
      });

      return {
        success: true,
        activationId: result.activationId,
      };

  }
);
