import { z } from 'zod';

import { FirestoreTimestampSchema } from './retail-domain';

/**
 * Canonical iNteract Platform AI Governance schemas.
 *
 * ARCHITECTURE:
 * Recognized Standards / Applicable Law
 *   → Platform AI Governance
 *     → Technical Enforcement
 *       → Retailer Additive Governance
 *         → Retailer Ari Configuration
 *           → Permitted Activation Context
 *             → Authoritative Evidence + Shopper Session
 *               → Ari Runtime
 *
 * These schemas describe canonical persisted governance state.
 *
 * Authorization, governance lifecycle transitions, immutable-control
 * enforcement, active-policy uniqueness and change authorization remain
 * backend responsibilities.
 */

export const GovernanceStatusSchema = z.enum([
  'DRAFT',
  'UNDER_REVIEW',
  'APPROVED',
  'ACTIVE',
  'SUPERSEDED',
  'RETIRED',
]);

export type GovernanceStatus = z.infer<typeof GovernanceStatusSchema>;

export const GovernanceAuthoritySchema = z.enum([
  'IMMUTABLE_PLATFORM_INVARIANT',
  'ADMIN_MANAGED',
  'DERIVED_EVIDENCE_BASED',
]);

export type GovernanceAuthority = z.infer<typeof GovernanceAuthoritySchema>;

export const GovernanceVerificationStatusSchema = z.enum([
  'DEFINED',
  'IMPLEMENTED',
  'VERIFIED',
  'NEEDS_REVIEW',
  'NONCONFORMING',
  'NOT_APPLICABLE',
]);

export type GovernanceVerificationStatus = z.infer<
  typeof GovernanceVerificationStatusSchema
>;

export const GovernanceEnforcementTypeSchema = z.enum([
  'APPLICATION_LOGIC',
  'AUTHORIZATION',
  'SCHEMA_VALIDATION',
  'DATA_GOVERNANCE',
  'EVIDENCE_BOUNDARY',
  'MODEL_INSTRUCTION',
  'PRIVACY_CONTROL',
  'SESSION_AUTHORITY',
  'TENANT_ISOLATION',
  'MONITORING',
  'AUDIT_LOGGING',
  'HUMAN_PROCESS',
  'CHANGE_CONTROL',
  'INCIDENT_RESPONSE',
]);

export type GovernanceEnforcementType = z.infer<
  typeof GovernanceEnforcementTypeSchema
>;

export const GovernanceVisibilitySchema = z.enum([
  'INTERNAL_ONLY',
  'READ_ONLY',
]);

export type GovernanceVisibility = z.infer<
  typeof GovernanceVisibilitySchema
>;

export const GovernanceRetailerExtensibilitySchema = z.enum([
  'NONE',
  'ADDITIVE_ONLY',
]);

export type GovernanceRetailerExtensibility = z.infer<
  typeof GovernanceRetailerExtensibilitySchema
>;

export const GovernanceApplicabilitySchema = z.enum([
  'PLATFORM',
  'CAPABILITY',
  'CONDITIONAL',
]);

export type GovernanceApplicability = z.infer<
  typeof GovernanceApplicabilitySchema
>;

export const GovernanceStandardMappingSchema = z.object({
  standard: z.string().min(1),
  reference: z.string().min(1),
  relationship: z.string().min(1),
  notes: z.string().min(1).optional(),
});

export type GovernanceStandardMapping = z.infer<
  typeof GovernanceStandardMappingSchema
>;

/**
 * Canonical governance control definition.
 *
 * This describes what a control means. It does not claim that the control
 * is implemented, verified or effective, and therefore deliberately excludes
 * evidence, verification and audit metadata.
 */
export const PlatformAiGovernanceControlDefinitionSchema = z.object({
  controlId: z.string().min(1),

  domain: z.string().min(1),
  title: z.string().min(1),

  requirement: z.string().min(1),
  risk: z.string().min(1),
  controlStatement: z.string().min(1),

  authority: GovernanceAuthoritySchema,
  applicability: GovernanceApplicabilitySchema,

  enforcementTypes: z
    .array(GovernanceEnforcementTypeSchema)
    .min(1),

  standardsMappings: z
    .array(GovernanceStandardMappingSchema)
    .default([]),

  visibility: GovernanceVisibilitySchema,
  retailerExtensibility: GovernanceRetailerExtensibilitySchema,
});

export type PlatformAiGovernanceControlDefinition = z.infer<
  typeof PlatformAiGovernanceControlDefinitionSchema
>;

/**
 * Versioned Platform AI Governance policy.
 *
 * FIRESTORE:
 * aiGovernancePolicies/{governanceId}__{governanceVersion}
 *
 * Document identity is version-safe so activation of a future governance
 * version cannot overwrite historical policy state.
 *
 * APPROVED does not mean ACTIVE.
 * Exactly one ACTIVE policy is a backend lifecycle invariant.
 */
export const PlatformAiGovernancePolicySchema = z.object({
  governanceId: z.string().min(1),
  governanceVersion: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1).optional(),

  status: GovernanceStatusSchema,

  effectiveAt: FirestoreTimestampSchema.optional(),
  supersedesGovernanceId: z.string().min(1).optional(),

  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().min(1),

  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().min(1),

  approvedAt: FirestoreTimestampSchema.optional(),
  approvedBy: z.string().min(1).optional(),

  activatedAt: FirestoreTimestampSchema.optional(),
  activatedBy: z.string().min(1).optional(),

  supersededAt: FirestoreTimestampSchema.optional(),
  supersededBy: z.string().min(1).optional(),

  retiredAt: FirestoreTimestampSchema.optional(),
  retiredBy: z.string().min(1).optional(),
});

export type PlatformAiGovernancePolicy = z.infer<
  typeof PlatformAiGovernancePolicySchema
>;

/**
 * Canonical governance control.
 *
 * Control definitions are version-bound. A future governance version must
 * preserve its historical control definitions rather than overwrite them.
 *
 * The presence of a control document does not by itself prove implementation,
 * verification or effectiveness.
 */
export const PlatformAiGovernanceControlSchema = z.object({
  controlId: z.string().min(1),
  governanceId: z.string().min(1),
  governanceVersion: z.string().min(1),

  domain: z.string().min(1),
  title: z.string().min(1),

  requirement: z.string().min(1),
  risk: z.string().min(1),
  controlStatement: z.string().min(1),

  authority: GovernanceAuthoritySchema,
  applicability: GovernanceApplicabilitySchema,

  capabilityIds: z.array(z.string().min(1)).default([]),

  enforcementTypes: z
    .array(GovernanceEnforcementTypeSchema)
    .min(1),

  implementationReferences: z.array(z.string().min(1)).default([]),
  evidenceIds: z.array(z.string().min(1)).default([]),

  verificationStatus: GovernanceVerificationStatusSchema,

  notApplicableRationale: z.string().min(1).optional(),

  owner: z.string().min(1),
  reviewFrequency: z.string().min(1),

  standardsMappings: z
    .array(GovernanceStandardMappingSchema)
    .default([]),

  visibility: GovernanceVisibilitySchema,
  retailerExtensibility: GovernanceRetailerExtensibilitySchema,

  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().min(1),

  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().min(1),
});

export type PlatformAiGovernanceControl = z.infer<
  typeof PlatformAiGovernanceControlSchema
>;

/**
 * Authoritative pointer to the single active Platform AI Governance policy.
 *
 * FIRESTORE:
 * platformConfiguration/aiGovernance
 *
 * This is a compact activation pointer, not a duplicate of the policy,
 * controls, evidence or runtime governance context.
 */
export const ActiveAiGovernancePointerSchema = z.object({
  governanceId: z.string().min(1),
  governanceVersion: z.string().min(1),
  policyDocumentId: z.string().min(1),

  activatedAt: FirestoreTimestampSchema,
  activatedBy: z.string().min(1),
});

export type ActiveAiGovernancePointer = z.infer<
  typeof ActiveAiGovernancePointerSchema
>;
