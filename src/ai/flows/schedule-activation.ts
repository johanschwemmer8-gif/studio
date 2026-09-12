'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { ActivationSchema } from '@/lib/schemas/activation';
import {
  ScheduleActivationInputSchema,
  type ScheduleActivationInput,
} from '@/lib/schemas/activation-command';

const ScheduleActivationOutputSchema = z.object({
  success: z.boolean(),
  activationId: z.string(),
  status: z.enum(['SCHEDULED', 'ACTIVE']),
});

export type ScheduleActivationOutput = z.infer<
  typeof ScheduleActivationOutputSchema
>;

export async function scheduleActivation(
  input: ScheduleActivationInput
): Promise<ScheduleActivationOutput> {
  return scheduleActivationFlow(input);
}

const scheduleActivationFlow = ai.defineFlow(
  {
    name: 'scheduleActivationFlow',
    inputSchema: ScheduleActivationInputSchema,
    outputSchema: ScheduleActivationOutputSchema,
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

    requireCapability(actor.role, 'ACTIVATION_SCHEDULE');

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

    if (existingActivation.status !== 'DRAFT') {
      throw new Error(
        'INVALID_ACTIVATION_TRANSITION: Only submitted and approved DRAFT Activations can be scheduled.'
      );
    }

    if (existingActivation.submittedAt === undefined) {
      throw new Error(
        'ACTIVATION_NOT_SUBMITTED: Activation must be submitted before scheduling.'
      );
    }

    if (
      existingActivation.approvalRequired === true &&
      existingActivation.approvedAt === undefined
    ) {
      throw new Error(
        'ACTIVATION_NOT_APPROVED: Approval-required Activation must be approved before scheduling.'
      );
    }

    const startAt = admin.firestore.Timestamp.fromDate(
      new Date(data.startAt)
    );

    const endAt =
      data.endAt !== undefined
        ? admin.firestore.Timestamp.fromDate(new Date(data.endAt))
        : undefined;

    if (
      endAt !== undefined &&
      endAt.toMillis() < startAt.toMillis()
    ) {
      throw new Error(
        'INVALID_ACTIVATION_SCHEDULE: endAt must be greater than or equal to startAt.'
      );
    }

    const now = admin.firestore.Timestamp.now();

    if (
      endAt !== undefined &&
      endAt.toMillis() < now.toMillis()
    ) {
      throw new Error(
        'INVALID_ACTIVATION_SCHEDULE: Activation cannot be scheduled with an endAt in the past.'
      );
    }

    const nextStatus: 'SCHEDULED' | 'ACTIVE' =
      startAt.toMillis() <= now.toMillis()
        ? 'ACTIVE'
        : 'SCHEDULED';

    const candidateActivation = {
      ...existingActivation,
      status: nextStatus,
      startAt,
      endAt,
      timezone: data.timezone,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    ActivationSchema.parse(candidateActivation);

    const updateData: Record<string, unknown> = {
      status: candidateActivation.status,
      startAt: candidateActivation.startAt,
      timezone: candidateActivation.timezone,
      updatedAt: candidateActivation.updatedAt,
      updatedBy: candidateActivation.updatedBy,
    };

    if (candidateActivation.endAt !== undefined) {
      updateData.endAt = candidateActivation.endAt;
    }

    await activationRef.update(updateData);

    return {
      success: true,
      activationId: data.activationId,
      status: nextStatus,
    };
  }
);
