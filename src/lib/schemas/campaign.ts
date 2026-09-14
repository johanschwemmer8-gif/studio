import { z } from 'zod';

import {
  CampaignStatusSchema,
  FirestoreTimestampSchema,
} from './retail-domain';

/**
 * Canonical Campaign document schema.
 *
 * FIRESTORE:
 * campaigns/{campaignId}
 *
 * ARCHITECTURE:
 * Retailer
 *   → Campaign
 *     → Activation
 *       → Deployment
 *         → QR
 *
 * A Campaign is the retailer-owned commercial/operational container for
 * related Point-of-Decision Activations.
 *
 * A Campaign does NOT contain:
 * - QR codes
 * - Deployments
 * - Product Catalog records
 * - Shopper sessions
 * - Scan counts
 * - Ari prompts/configuration
 * - Transaction data
 *
 * Authorization, tenant isolation, lifecycle transitions and immutable-field
 * enforcement remain backend responsibilities.
 */
export const CampaignSchema = z.object({
  /**
   * Immutable Campaign identity.
   */
  campaignId: z.string().min(1),

  /**
   * Immutable tenant owner.
   *
   * The persisted value must be derived/validated by the backend rather than
   * trusted from an unauthorised client request.
   */
  retailerId: z.string().min(1),

  /**
   * Human-readable Campaign identity.
   */
  name: z.string().min(1),

  /**
   * Optional descriptive information.
   */
  description: z.string().optional(),

  /**
   * Optional commercial/operational purpose.
   */
  purpose: z.string().optional(),

  /**
   * Optional Campaign objective.
   */
  objective: z.string().optional(),

  /**
   * Campaign lifecycle.
   */
  status: CampaignStatusSchema,

  /**
   * Campaign scheduling.
   *
   * These remain optional because a DRAFT Campaign does not necessarily have
   * a production schedule yet.
   */
  startAt: FirestoreTimestampSchema.optional(),
  endAt: FirestoreTimestampSchema.optional(),
  timezone: z.string().min(1).optional(),

  /**
   * Audit metadata.
   */
  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().min(1),

  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().min(1),

  /**
   * Archive metadata.
   *
   * Meaningful production Campaigns are archived rather than destructively
   * deleted.
   */
  archivedAt: FirestoreTimestampSchema.optional(),
  archivedBy: z.string().min(1).optional(),
});

export type Campaign = z.infer<typeof CampaignSchema>;
