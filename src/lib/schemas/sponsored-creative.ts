import { z } from 'zod';

import { FirestoreTimestampSchema } from './retail-domain';

/**
 * Canonical sponsored creative identity.
 *
 * ARCHITECTURE:
 * - A Sponsored Creative belongs to one retailer-specific Retail Media Partner.
 * - creativeId identifies the measurable creative asset.
 * - mediaUrl is content location, not identity.
 * - A creative does not own Campaigns, Activations, Deployments, or QR codes.
 * - Materially different shopper-facing creative should receive a new
 *   creativeId so historical measurement remains intact.
 */
export const SponsoredCreativeFormatSchema = z.enum([
  'VIDEO',
  'BRAND_STRIP',
]);

export type SponsoredCreativeFormat = z.infer<
  typeof SponsoredCreativeFormatSchema
>;

export const SponsoredCreativeStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'RETIRED',
]);

export type SponsoredCreativeStatus = z.infer<
  typeof SponsoredCreativeStatusSchema
>;

export const SponsoredCreativeSchema = z.object({
  creativeId: z.string().trim().min(1),

  retailerId: z.string().trim().min(1),
  partnerId: z.string().trim().min(1),

  format: SponsoredCreativeFormatSchema,
  mediaUrl: z.string().url(),
  headline: z.string().trim().min(1).optional(),
  destinationUrl: z.string().url().optional(),

  status: SponsoredCreativeStatusSchema,

  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().trim().min(1),
  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().trim().min(1),

  retiredAt: FirestoreTimestampSchema.optional(),
  retiredBy: z.string().trim().min(1).optional(),
});

export type SponsoredCreative = z.infer<
  typeof SponsoredCreativeSchema
>;
