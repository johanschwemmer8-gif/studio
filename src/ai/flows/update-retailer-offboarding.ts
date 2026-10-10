'use server';

import { z } from 'zod';
import { admin, getDb } from '@/lib/firebase-admin';
import { verifyPlatformOperator } from '@/lib/auth-server';
import {
  TenantRetentionDecisionSchema,
  normalizeTenantLifecycleStatus,
  type TenantRetentionDecision,
} from '@/lib/schemas/tenant';

const UpdateRetailerOffboardingInputSchema = z.discriminatedUnion('checkpoint', [
  z.object({
    idToken: z.string().min(1),
    retailerId: z.string().trim().min(1),
    checkpoint: z.literal('EXPORT_PREPARATION'),
  }),
  z.object({
    idToken: z.string().min(1),
    retailerId: z.string().trim().min(1),
    checkpoint: z.literal('HANDOVER'),
  }),
  z.object({
    idToken: z.string().min(1),
    retailerId: z.string().trim().min(1),
    checkpoint: z.literal('RETENTION_DECISION'),
    decision: TenantRetentionDecisionSchema,
  }),
]);

export type UpdateRetailerOffboardingInput = z.infer<
  typeof UpdateRetailerOffboardingInputSchema
>;

export type UpdateRetailerOffboardingOutput = {
  success: boolean;
  message: string;
  checkpoint?: 'EXPORT_PREPARATION' | 'HANDOVER' | 'RETENTION_DECISION';
  decision?: TenantRetentionDecision;
};

export async function updateRetailerOffboarding(
  rawInput: UpdateRetailerOffboardingInput
): Promise<UpdateRetailerOffboardingOutput> {
  try {
    const input = UpdateRetailerOffboardingInputSchema.parse(rawInput);
    const operator = await verifyPlatformOperator(input.idToken);

    const db = getDb();

    if (!db) {
      return {
        success: false,
        message: 'Infrastructure Unavailable: Firestore.',
      };
    }

    const tenantRef = db.collection('tenants').doc(input.retailerId);

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(tenantRef);

      if (!snapshot.exists) {
        throw new Error('RETAILER_NOT_FOUND');
      }

      const data = snapshot.data() as Record<string, unknown>;
      const lifecycleStatus = normalizeTenantLifecycleStatus(
        data.lifecycleStatus,
        data.status
      );

      if (
        input.checkpoint === 'EXPORT_PREPARATION' ||
        input.checkpoint === 'HANDOVER'
      ) {
        if (lifecycleStatus !== 'OFFBOARDING') {
          throw new Error('CHECKPOINT_NOT_ALLOWED');
        }
      }

      if (
        input.checkpoint === 'RETENTION_DECISION' &&
        lifecycleStatus !== 'SUSPENDED'
      ) {
        throw new Error('CHECKPOINT_NOT_ALLOWED');
      }

      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      if (input.checkpoint === 'EXPORT_PREPARATION') {
        transaction.update(tenantRef, {
          'offboarding.exportPreparation': {
            completed: true,
            completedAt: timestamp,
            completedBy: operator.uid,
          },
          updatedAt: timestamp,
          updatedBy: operator.uid,
        });
      }

      if (input.checkpoint === 'HANDOVER') {
        transaction.update(tenantRef, {
          'offboarding.handover': {
            completed: true,
            completedAt: timestamp,
            completedBy: operator.uid,
          },
          updatedAt: timestamp,
          updatedBy: operator.uid,
        });
      }

      if (input.checkpoint === 'RETENTION_DECISION') {
        transaction.update(tenantRef, {
          'offboarding.retentionDecision': {
            decision: input.decision,
            recordedAt: timestamp,
            recordedBy: operator.uid,
          },
          updatedAt: timestamp,
          updatedBy: operator.uid,
        });
      }
    });

    try {
      await db.collection('auditLogs').add({
        action: 'RETAILER_OFFBOARDING_CHECKPOINT',
        targetRetailerId: input.retailerId,
        checkpoint: input.checkpoint,
        ...(input.checkpoint === 'RETENTION_DECISION'
          ? { decision: input.decision }
          : {}),
        performedByUid: operator.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        result: 'success',
      });
    } catch (auditError) {
      console.error(
        '[Retailer Offboarding] Audit write failed:',
        auditError instanceof Error ? auditError.message : auditError
      );
    }

    return {
      success: true,
      message:
        input.checkpoint === 'EXPORT_PREPARATION'
          ? 'Export preparation recorded.'
          : input.checkpoint === 'HANDOVER'
            ? 'Handover completion recorded.'
            : 'Retention decision recorded.',
      checkpoint: input.checkpoint,
      ...(input.checkpoint === 'RETENTION_DECISION'
        ? { decision: input.decision }
        : {}),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    console.error('[Retailer Offboarding] Checkpoint update failed:', message);

    if (message === 'RETAILER_NOT_FOUND') {
      return {
        success: false,
        message: 'Retailer tenant not found.',
      };
    }

    if (message === 'CHECKPOINT_NOT_ALLOWED') {
      return {
        success: false,
        message:
          'This offboarding checkpoint is not permitted in the retailer current lifecycle state.',
      };
    }

    return {
      success: false,
      message: 'Retailer offboarding checkpoint update failed.',
    };
  }
}
