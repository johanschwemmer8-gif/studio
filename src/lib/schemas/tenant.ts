import { z } from 'zod';

export const TenantTypeSchema = z.enum(['production', 'test']);

export const TenantLifecycleStatusSchema = z.enum([
  'ACTIVE',
  'OFFBOARDING',
  'SUSPENDED',
  'DECOMMISSIONED',
]);

export const LegacyTenantStatusSchema = z.enum([
  'active',
]);

export const TenantRetentionDecisionSchema = z.enum([
  'RETAIN',
  'DELETE_AFTER_RETENTION',
]);

export const TenantOffboardingCheckpointSchema = z.object({
  completed: z.boolean(),
  completedAt: z.unknown().optional(),
  completedBy: z.string().trim().min(1).optional(),
});

export const TenantRetentionCheckpointSchema = z.object({
  decision: TenantRetentionDecisionSchema,
  recordedAt: z.unknown(),
  recordedBy: z.string().trim().min(1),
});

export const TenantOffboardingSchema = z.object({
  exportPreparation: TenantOffboardingCheckpointSchema.optional(),
  handover: TenantOffboardingCheckpointSchema.optional(),
  retentionDecision: TenantRetentionCheckpointSchema.optional(),
});

export const TenantDocumentSchema = z.object({
  name: z.string().trim().min(1),
  type: TenantTypeSchema,
  lifecycleStatus: TenantLifecycleStatusSchema.optional(),
  status: LegacyTenantStatusSchema.optional(),
  offboarding: TenantOffboardingSchema.optional(),
  createdAt: z.unknown(),
  updatedAt: z.unknown().optional(),
});

export type TenantType = z.infer<typeof TenantTypeSchema>;
export type TenantLifecycleStatus = z.infer<
  typeof TenantLifecycleStatusSchema
>;
export type TenantRetentionDecision = z.infer<
  typeof TenantRetentionDecisionSchema
>;
export type TenantOffboarding = z.infer<typeof TenantOffboardingSchema>;
export type TenantDocument = z.infer<typeof TenantDocumentSchema>;

export type SavedRetailer = TenantDocument & {
  id: string;
  lifecycleStatus: TenantLifecycleStatus;
};

export function normalizeTenantLifecycleStatus(
  value: unknown,
  legacyStatus?: unknown
): TenantLifecycleStatus {
  if (TenantLifecycleStatusSchema.safeParse(value).success) {
    return value as TenantLifecycleStatus;
  }

  if (legacyStatus === 'active') {
    return 'ACTIVE';
  }

  throw new Error('Tenant lifecycle status is missing or unrecognized.');
}

export function isTenantActive(
  lifecycleStatus: unknown,
  legacyStatus?: unknown
): boolean {
  try {
    return normalizeTenantLifecycleStatus(
      lifecycleStatus,
      legacyStatus
    ) === 'ACTIVE';
  } catch {
    return false;
  }
}

/**
 * Runtime operational access is deliberately broader than ACTIVE-only
 * administrative eligibility.
 *
 * ACTIVE and OFFBOARDING tenants remain operational so controlled
 * handover/export work can continue during offboarding.
 *
 * SUSPENDED, DECOMMISSIONED, missing, and unrecognized lifecycle states
 * fail closed.
 */
export function isTenantOperational(
  lifecycleStatus: unknown,
  legacyStatus?: unknown
): boolean {
  try {
    const status = normalizeTenantLifecycleStatus(
      lifecycleStatus,
      legacyStatus
    );

    return status === 'ACTIVE' || status === 'OFFBOARDING';
  } catch {
    return false;
  }
}

export const TENANT_LIFECYCLE_TRANSITIONS: Readonly<
  Partial<Record<TenantLifecycleStatus, TenantLifecycleStatus>>
> = {
  ACTIVE: 'OFFBOARDING',
  OFFBOARDING: 'SUSPENDED',
  SUSPENDED: 'DECOMMISSIONED',
};

export function isTenantDecommissioningReady(
  offboarding: TenantOffboarding | undefined
): boolean {
  return Boolean(
    offboarding?.exportPreparation?.completed === true &&
      offboarding.exportPreparation.completedAt &&
      offboarding.exportPreparation.completedBy &&
      offboarding?.handover?.completed === true &&
      offboarding.handover.completedAt &&
      offboarding.handover.completedBy &&
      offboarding?.retentionDecision?.decision &&
      offboarding.retentionDecision.recordedAt &&
      offboarding.retentionDecision.recordedBy
  );
}

export function getNextTenantLifecycleStatus(
  current: TenantLifecycleStatus
): TenantLifecycleStatus | null {
  return TENANT_LIFECYCLE_TRANSITIONS[current] ?? null;
}

export function canTransitionTenantLifecycle(
  current: TenantLifecycleStatus,
  next: TenantLifecycleStatus
): boolean {
  return getNextTenantLifecycleStatus(current) === next;
}

export function normalizeTenantDocument(
  id: string,
  data: Record<string, unknown>
): SavedRetailer {
  const parsed = TenantDocumentSchema.parse(data);

  return {
    ...parsed,
    id,
    lifecycleStatus: normalizeTenantLifecycleStatus(
      parsed.lifecycleStatus,
      parsed.status
    ),
  };
}
