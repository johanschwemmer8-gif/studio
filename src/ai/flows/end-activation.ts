'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { ActivationSchema } from '@/lib/schemas/activation';
import {
  EndActivationInputSchema,
  type EndActivationInput,
} from '@/lib/schemas/activation-command';

const EndActivationOutputSchema = z.object({
  success: z.boolean(),
  activationId: z.string(),
  status: z.literal('ENDED'),
});

export type EndActivationOutput = z.infer<
  typeof EndActivationOutputSchema
>;

export async function endActivation(
  input: EndActivationInput
): Promise<EndActivationOutput> {
  return endActivationFlow(input);
}

const endActivationFlow = ai.defineFlow(
  {
    name: 'endActivationFlow',
    inputSchema: EndActivationInputSchema,
    outputSchema: EndActivationOutputSchema,
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

    requireCapability(actor.role, 'ACTIVATION_END');

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
      existingActivation.status !== 'SCHEDULED' &&
      existingActivation.status !== 'ACTIVE' &&
      existingActivation.status !== 'PAUSED'
    ) {
      throw new Error(
        'INVALID_ACTIVATION_TRANSITION: Only SCHEDULED, ACTIVE, or PAUSED Activations can be ended.'
      );
    }

    const now = admin.firestore.Timestamp.now();
    const nextStatus: 'ENDED' = 'ENDED';

    const candidateActivation = {
      ...existingActivation,
      status: nextStatus,
      endedAt: now,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    ActivationSchema.parse(candidateActivation);

    await activationRef.update({
      status: candidateActivation.status,
      endedAt: candidateActivation.endedAt,
      updatedAt: candidateActivation.updatedAt,
      updatedBy: candidateActivation.updatedBy,
    });

    return {
      success: true,
      activationId: data.activationId,
      status: nextStatus,
    };
  }
);
