import { z } from 'zod';

/**
 * Shared domain primitives for the canonical retail activation architecture.
 *
 * ARCHITECTURE:
 * Retailer
 *   → Campaign
 *     → Activation
 *       → Deployment
 *         → QR
 *
 * These schemas describe persisted domain values.
 * They do NOT grant authorization or determine whether a lifecycle transition
 * is permitted. Authorization and lifecycle transition rules remain backend
 * responsibilities.
 */

/**
 * Firestore timestamps are persisted as Timestamp-like values.
 *
 * This structural representation deliberately avoids importing a specific
 * Firebase client/admin Timestamp class into the shared domain schema layer.
 * That keeps these schemas usable from both server and application code.
 */
export const FirestoreTimestampSchema = z.object({
  seconds: z.number().int(),
  nanoseconds: z.number().int().min(0).max(999999999),
});

export type FirestoreTimestamp = z.infer<
  typeof FirestoreTimestampSchema
>;

/**
 * Campaign lifecycle.
 */
export const CampaignStatusSchema = z.enum([
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
  'ENDED',
  'ARCHIVED',
]);

export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

/**
 * Activation lifecycle.
 */
export const ActivationStatusSchema = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
  'ENDED',
  'ARCHIVED',
]);

export type ActivationStatus = z.infer<typeof ActivationStatusSchema>;

/**
 * Physical deployment lifecycle.
 *
 * Deployment status is independent of Activation and QR status.
 */
export const DeploymentStatusSchema = z.enum([
  'NOT_ASSIGNED',
  'ASSIGNED',
  'READY_TO_PRINT',
  'PRINTED',
  'DEPLOYED',
  'PROBLEM_REPORTED',
]);

export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;

/**
 * Stable QR artifact lifecycle.
 *
 * QR lifecycle does not determine whether an Activation is live.
 */
export const QrCodeStatusSchema = z.enum([
  'GENERATED',
  'ASSIGNED',
  'DEPLOYED',
  'RETIRED',
]);

export type QrCodeStatus = z.infer<typeof QrCodeStatusSchema>;

/**
 * QR environment classification.
 *
 * This explicitly separates production QR identities from test/demo
 * identities. Prefixes such as "test_" or "demo_" may still be used for
 * readability, but they must never be the environment authority.
 */
export const QrEnvironmentSchema = z.enum([
  "PRODUCTION",
  "TEST",
  "DEMO",
]);

export type QrEnvironment = z.infer<typeof QrEnvironmentSchema>;

/**
 * Primary retailer-defined Point-of-Decision target level.
 *
 * Exactly one Primary Target belongs to an Activation.
 */
export const ActivationTargetLevelSchema = z.enum([
  'CATEGORY',
  'SUBCATEGORY',
  'PRODUCT_TYPE',
  'BRAND',
  'PRODUCT',
]);

export type ActivationTargetLevel = z.infer<
  typeof ActivationTargetLevelSchema
>;
