'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { ActivationSchema } from '@/lib/schemas/activation';
import {
  ArchiveActivationInputSchema,
  type ArchiveActivationInput,
} from '@/lib/schemas/activation-command';

const ArchiveActivationOutputSchema = z.object({
  success: z.boolean(),
  activationId: z.string(),
  status: z.literal('ARCHIVED'),
});

export type ArchiveActivationOutput = z.infer<
  typeof ArchiveActivationOutputSchema
>;

export async function archiveActivation(
  input: ArchiveActivationInput
): Promise<ArchiveActivationOutput> {
  return archiveActivationFlow(input);
}

const archiveActivationFlow = ai.defineFlow(
  {
    name: 'archiveActivationFlow',
    inputSchema: ArchiveActivationInputSchema,
    outputSchema: ArchiveActivationOutputSchema,
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

    requireCapability(actor.role, 'ACTIVATION_ARCHIVE');

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

    if (existingActivation.status === 'ARCHIVED') {
      return {
        success: true,
        activationId: data.activationId,
        status: 'ARCHIVED' as const,
      };
    }

    if (
      existingActivation.status !== 'DRAFT' &&
      existingActivation.status !== 'PENDING_APPROVAL' &&
      existingActivation.status !== 'ENDED'
    ) {
      throw new Error(
        'INVALID_ACTIVATION_TRANSITION: Only DRAFT, PENDING_APPROVAL, or ENDED Activations can be archived.'
      );
    }

    const now = admin.firestore.Timestamp.now();
    const nextStatus: 'ARCHIVED' = 'ARCHIVED';

    const candidateActivation = {
      ...existingActivation,
      status: nextStatus,
      archivedAt: now,
      archivedBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    ActivationSchema.parse(candidateActivation);

    await activationRef.update({
      status: candidateActivation.status,
      archivedAt: candidateActivation.archivedAt,
      archivedBy: candidateActivation.archivedBy,
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
