'use server';

import { z } from 'zod';
import { admin, getDb } from '@/lib/firebase-admin';
import { verifyPlatformOperator } from '@/lib/auth-server';
import {
  TenantLifecycleStatusSchema,
  canTransitionTenantLifecycle,
  normalizeTenantLifecycleStatus,
  type TenantLifecycleStatus,
} from '@/lib/schemas/tenant';

const UpdateRetailerLifecycleInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().trim().min(1),
  nextStatus: TenantLifecycleStatusSchema,
});

export type UpdateRetailerLifecycleInput = z.infer<
  typeof UpdateRetailerLifecycleInputSchema
>;

export type UpdateRetailerLifecycleOutput = {
  success: boolean;
  message: string;
  lifecycleStatus?: TenantLifecycleStatus;
};

function transitionMetadata(
  nextStatus: TenantLifecycleStatus,
  operatorUid: string
): Record<string, unknown> {
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  if (nextStatus === 'OFFBOARDING') {
    return {
      offboardingStartedAt: timestamp,
      offboardingStartedBy: operatorUid,
    };
  }

  if (nextStatus === 'SUSPENDED') {
    return {
      suspendedAt: timestamp,
      suspendedBy: operatorUid,
    };
  }

  if (nextStatus === 'DECOMMISSIONED') {
    return {
      decommissionedAt: timestamp,
      decommissionedBy: operatorUid,
    };
  }

  return {};
}

export async function updateRetailerLifecycle(
  rawInput: UpdateRetailerLifecycleInput
): Promise<UpdateRetailerLifecycleOutput> {
  try {
    const input = UpdateRetailerLifecycleInputSchema.parse(rawInput);
    const operator = await verifyPlatformOperator(input.idToken);

    const db = getDb();

    if (!db) {
      return {
        success: false,
        message: 'Infrastructure Unavailable: Firestore.',
      };
    }

    const tenantRef = db.collection('tenants').doc(input.retailerId);

    const transition = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(tenantRef);

      if (!snapshot.exists) {
        throw new Error('RETAILER_NOT_FOUND');
      }

      const data = snapshot.data() as Record<string, unknown>;

      const currentStatus = normalizeTenantLifecycleStatus(
        data.lifecycleStatus,
        data.status
      );

      if (!canTransitionTenantLifecycle(currentStatus, input.nextStatus)) {
        throw new Error(
          `INVALID_LIFECYCLE_TRANSITION:${currentStatus}:${input.nextStatus}`
        );
      }

      transaction.update(tenantRef, {
        lifecycleStatus: input.nextStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: operator.uid,
        ...transitionMetadata(input.nextStatus, operator.uid),
      });

      return {
        currentStatus,
        nextStatus: input.nextStatus,
      };
    });

    try {
      await db.collection('auditLogs').add({
        action: 'RETAILER_LIFECYCLE_TRANSITION',
        targetRetailerId: input.retailerId,
        previousLifecycleStatus: transition.currentStatus,
        lifecycleStatus: transition.nextStatus,
        performedByUid: operator.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        result: 'success',
      });
    } catch (auditError) {
      console.error(
        '[Retailer Lifecycle] Audit write failed:',
        auditError instanceof Error ? auditError.message : auditError
      );
    }

    return {
      success: true,
      message: `Retailer lifecycle changed from ${transition.currentStatus} to ${transition.nextStatus}.`,
      lifecycleStatus: transition.nextStatus,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    console.error('[Retailer Lifecycle] Transition failed:', message);

    if (message === 'RETAILER_NOT_FOUND') {
      return {
        success: false,
        message: 'Retailer tenant not found.',
      };
    }

    if (message.startsWith('INVALID_LIFECYCLE_TRANSITION:')) {
      return {
        success: false,
        message: 'The requested retailer lifecycle transition is not permitted.',
      };
    }

    return {
      success: false,
      message: 'Retailer lifecycle update failed.',
    };
  }
}
