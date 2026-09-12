'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { ActivationSchema } from '@/lib/schemas/activation';
import {
  ApproveActivationInputSchema,
  type ApproveActivationInput,
} from '@/lib/schemas/activation-command';

const ApproveActivationOutputSchema = z.object({
  success: z.boolean(),
  activationId: z.string(),
  status: z.literal('DRAFT'),
});

export type ApproveActivationOutput = z.infer<
  typeof ApproveActivationOutputSchema
>;

export async function approveActivation(
  input: ApproveActivationInput
): Promise<ApproveActivationOutput> {
  return approveActivationFlow(input);
}

const approveActivationFlow = ai.defineFlow(
  {
    name: 'approveActivationFlow',
    inputSchema: ApproveActivationInputSchema,
    outputSchema: ApproveActivationOutputSchema,
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

    requireCapability(actor.role, 'ACTIVATION_APPROVE');

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
      existingActivation.status !== 'PENDING_APPROVAL' ||
      existingActivation.approvalRequired !== true
    ) {
      throw new Error(
        'INVALID_ACTIVATION_TRANSITION: Only approval-required PENDING_APPROVAL Activations can be approved.'
      );
    }

    const now = admin.firestore.Timestamp.now();
    const nextStatus: 'DRAFT' = 'DRAFT';

    const candidateActivation = {
      ...existingActivation,
      status: nextStatus,
      approvedAt: now,
      approvedBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    ActivationSchema.parse(candidateActivation);

    await activationRef.update({
      status: candidateActivation.status,
      approvedAt: candidateActivation.approvedAt,
      approvedBy: candidateActivation.approvedBy,
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
