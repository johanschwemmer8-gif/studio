'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { ActivationSchema } from '@/lib/schemas/activation';
import {
  SubmitActivationInputSchema,
  type SubmitActivationInput,
} from '@/lib/schemas/activation-command';

const SubmitActivationOutputSchema = z.object({
  success: z.boolean(),
  activationId: z.string(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL']),
});

export type SubmitActivationOutput = z.infer<
  typeof SubmitActivationOutputSchema
>;

export async function submitActivation(
  input: SubmitActivationInput
): Promise<SubmitActivationOutput> {
  return submitActivationFlow(input);
}

const submitActivationFlow = ai.defineFlow(
  {
    name: 'submitActivationFlow',
    inputSchema: SubmitActivationInputSchema,
    outputSchema: SubmitActivationOutputSchema,
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

    requireCapability(actor.role, 'ACTIVATION_SUBMIT');

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
        'INVALID_ACTIVATION_TRANSITION: Only unsubmitted DRAFT Activations can be submitted.'
      );
    }

    const now = admin.firestore.Timestamp.now();
    const nextStatus: 'DRAFT' | 'PENDING_APPROVAL' =
      existingActivation.approvalRequired
        ? 'PENDING_APPROVAL'
        : 'DRAFT';

    const candidateActivation = {
      ...existingActivation,
      status: nextStatus,
      submittedAt: now,
      submittedBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    ActivationSchema.parse(candidateActivation);

    await activationRef.update({
      status: candidateActivation.status,
      submittedAt: candidateActivation.submittedAt,
      submittedBy: candidateActivation.submittedBy,
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
