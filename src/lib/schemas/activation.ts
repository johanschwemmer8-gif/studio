import { z } from 'zod';

import {
  ActivationStatusSchema,
  ActivationTargetLevelSchema,
  FirestoreTimestampSchema,
} from './retail-domain';

export const ActivationTargetSchema = z.object({
  level: ActivationTargetLevelSchema,
  value: z.string().min(1),
  label: z.string().optional(),
  productGtin: z.string().optional(),
});

export type ActivationTarget = z.infer<typeof ActivationTargetSchema>;

export const ActivationProductContextSchema = z.object({
  gtin: z.string().min(1),
  productId: z.string().optional(),
  productName: z.string().optional(),
});

export type ActivationProductContext = z.infer<typeof ActivationProductContextSchema>;

/**
 * Optional sponsored-media configuration for an Activation.
 *
 * ARCHITECTURE:
 * - Sponsored media belongs to the Activation shopper experience.
 * - It does not define Campaign, Deployment, QR, or Product identity.
 * - Absence of this object means that the Activation has no sponsored media.
 * - Shopper presentation and Ari-priority rules are enforced by the
 *   shopper-experience layer, not by QR identity.
 */
export const ActivationSponsoredMediaSchema = z.object({
  format: z.enum(['VIDEO', 'BRAND_STRIP']),
  sponsorName: z.string().trim().min(1),
  mediaUrl: z.string().url(),
  headline: z.string().trim().min(1).optional(),
  destinationUrl: z.string().url().optional(),
});

export type ActivationSponsoredMedia = z.infer<
  typeof ActivationSponsoredMediaSchema
>;

export const ActivationExperienceConfigSchema = z.object({
  tone: z.string().optional(),
  persona: z.string().optional(),
  goal: z.string().optional(),
  greeting: z.string().optional(),
  scanDestination: z.enum(['AI', 'URL']).optional(),
  landingPageUrl: z.string().url().optional(),

  /**
   * Canonical sponsored-media configuration.
   *
   * Legacy/general media fields below remain supported for backward
   * compatibility and are not the authority for sponsored-media behaviour.
   */
  sponsoredMedia: ActivationSponsoredMediaSchema.optional(),

  mediaType: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  headline: z.string().optional(),
  subhead: z.string().optional(),
});

export type ActivationExperienceConfig = z.infer<typeof ActivationExperienceConfigSchema>;

export const ActivationSchema = z.object({
  activationId: z.string().min(1),
  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  target: ActivationTargetSchema,
  productContext: z.array(ActivationProductContextSchema),
  shopperObjective: z.string().min(1),
  experienceMode: z.string().min(1),
  experienceConfig: ActivationExperienceConfigSchema,
  advancedInstructions: z.string().optional(),
  status: ActivationStatusSchema,
  approvalRequired: z.boolean(),
  submittedAt: FirestoreTimestampSchema.optional(),
  submittedBy: z.string().min(1).optional(),
  approvedAt: FirestoreTimestampSchema.optional(),
  approvedBy: z.string().min(1).optional(),
  startAt: FirestoreTimestampSchema.optional(),
  endAt: FirestoreTimestampSchema.optional(),
  timezone: z.string().min(1).optional(),
  configurationVersion: z.number().int().positive(),
  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().min(1),
  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().min(1),
  endedAt: FirestoreTimestampSchema.optional(),
  archivedAt: FirestoreTimestampSchema.optional(),
  archivedBy: z.string().min(1).optional(),
});

export type Activation = z.infer<typeof ActivationSchema>;
