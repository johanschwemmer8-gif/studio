import { z } from 'zod';

import { FirestoreTimestampSchema } from './retail-domain';

/**
 * Canonical Platform AI Governance evidence and change-event schemas.
 *
 * Evidence records prove or support governance implementation,
 * verification and assurance claims. The existence of an evidence record
 * does not by itself make a control VERIFIED.
 *
 * Large evidence artifacts should be referenced rather than duplicated
 * into Firestore.
 */

export const GovernanceEvidenceTypeSchema = z.enum([
  'AUTOMATED_TEST',
  'MANUAL_TEST',
  'CODE_REVIEW',
  'CONFIGURATION_SNAPSHOT',
  'AUDIT_LOG',
  'RISK_ASSESSMENT',
  'INCIDENT_RECORD',
  'APPROVAL_RECORD',
  'POLICY_DOCUMENT',
  'TECHNICAL_DOCUMENT',
  'MONITORING_RESULT',
]);

export type GovernanceEvidenceType = z.infer<
  typeof GovernanceEvidenceTypeSchema
>;

export const GovernanceEvidenceStatusSchema = z.enum([
  'CURRENT',
  'EXPIRED',
  'SUPERSEDED',
  'INVALIDATED',
]);

export type GovernanceEvidenceStatus = z.infer<
  typeof GovernanceEvidenceStatusSchema
>;

export const GovernanceChangeTypeSchema = z.enum([
  'POLICY_CREATED',
  'POLICY_UPDATED',
  'POLICY_SUBMITTED_FOR_REVIEW',
  'POLICY_APPROVED',
  'POLICY_ACTIVATED',
  'POLICY_SUPERSEDED',
  'POLICY_RETIRED',
  'CONTROL_UPDATED',
  'CONTROL_VERIFICATION_CHANGED',
  'EVIDENCE_RECORDED',
  'EVIDENCE_REVIEWED',
  'EVIDENCE_EXPIRED',
  'CAPABILITY_STATUS_CHANGED',
  'PROVIDER_MODEL_BINDING_CHANGED',
]);

export type GovernanceChangeType = z.infer<
  typeof GovernanceChangeTypeSchema
>;

/**
 * Governance evidence record.
 *
 * FIRESTORE:
 * aiGovernanceEvidence/{evidenceId}
 *
 * artifactReference points to the authoritative evidence location where
 * the evidence is not appropriately stored directly in Firestore.
 */
export const PlatformAiGovernanceEvidenceSchema = z.object({
  evidenceId: z.string().min(1),

  governanceId: z.string().min(1),
  governanceVersion: z.string().min(1),

  controlIds: z.array(z.string().min(1)).min(1),
  capabilityIds: z.array(z.string().min(1)).default([]),

  evidenceType: GovernanceEvidenceTypeSchema,
  status: GovernanceEvidenceStatusSchema,

  title: z.string().min(1),
  description: z.string().min(1).optional(),

  artifactReference: z.string().min(1).optional(),
  resultSummary: z.string().min(1).optional(),

  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().min(1),

  reviewedAt: FirestoreTimestampSchema.optional(),
  reviewedBy: z.string().min(1).optional(),

  expiresAt: FirestoreTimestampSchema.optional(),

  supersededByEvidenceId: z.string().min(1).optional(),

  invalidatedAt: FirestoreTimestampSchema.optional(),
  invalidatedBy: z.string().min(1).optional(),
  invalidationReason: z.string().min(1).optional(),
});

export type PlatformAiGovernanceEvidence = z.infer<
  typeof PlatformAiGovernanceEvidenceSchema
>;

/**
 * Append-oriented governance change record.
 *
 * FIRESTORE:
 * aiGovernanceChangeEvents/{changeEventId}
 *
 * This record captures governance provenance. It is not a substitute for
 * the authoritative policy, control, capability or evidence document.
 */
export const PlatformAiGovernanceChangeEventSchema = z.object({
  changeEventId: z.string().min(1),

  governanceId: z.string().min(1),
  governanceVersion: z.string().min(1),

  changeType: GovernanceChangeTypeSchema,

  actorId: z.string().min(1),
  occurredAt: FirestoreTimestampSchema,

  targetType: z.string().min(1),
  targetId: z.string().min(1),

  reason: z.string().min(1).optional(),
  changeSummary: z.string().min(1),

  evidenceIds: z.array(z.string().min(1)).default([]),
});

export type PlatformAiGovernanceChangeEvent = z.infer<
  typeof PlatformAiGovernanceChangeEventSchema
>;
