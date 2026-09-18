import { z } from 'zod';

import { FirestoreTimestampSchema } from './retail-domain';

/**
 * Canonical retailer-specific Retail Media Partner.
 *
 * ARCHITECTURE:
 * - A Retail Media Partner is a commercial participant in one retailer's
 *   Retail Media Network.
 * - It is not a retailer tenant, organizational Brand scope, Campaign owner,
 *   Activation owner, Deployment owner, or QR owner.
 * - partnerId is the stable Retail Media identity. Partner names are
 *   presentation data and must never be used as authorization identity.
 */
export const RetailMediaPartnerStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
]);

export type RetailMediaPartnerStatus = z.infer<
  typeof RetailMediaPartnerStatusSchema
>;

export const RetailMediaPartnerSchema = z.object({
  partnerId: z.string().trim().min(1),
  retailerId: z.string().trim().min(1),

  name: z.string().trim().min(1),
  status: RetailMediaPartnerStatusSchema,

  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),

  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().trim().min(1),
  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().trim().min(1),
});

export type RetailMediaPartner = z.infer<
  typeof RetailMediaPartnerSchema
>;
