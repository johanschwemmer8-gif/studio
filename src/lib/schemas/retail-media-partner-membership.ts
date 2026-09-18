import { z } from 'zod';

import { FirestoreTimestampSchema } from './retail-domain';

/**
 * Canonical external Retail Media Partner membership.
 *
 * ARCHITECTURE:
 * - Membership establishes the relationship between an authenticated user,
 *   one retailer, and one Retail Media Partner.
 * - It is deliberately separate from the retailer organizational hierarchy.
 * - It does not use CanonicalRole, AuthorizationScope, or organizational
 *   brandId as Partner identity.
 * - Permissions never expand Partner or retailer scope.
 */
export const RetailMediaPartnerMembershipStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
]);

export type RetailMediaPartnerMembershipStatus = z.infer<
  typeof RetailMediaPartnerMembershipStatusSchema
>;

export const RetailMediaPartnerPermissionsSchema = z.object({
  viewRetailMedia: z.boolean(),
  exportRetailMedia: z.boolean(),
});

export type RetailMediaPartnerPermissions = z.infer<
  typeof RetailMediaPartnerPermissionsSchema
>;

export const RetailMediaPartnerMembershipSchema = z.object({
  membershipId: z.string().trim().min(1),

  uid: z.string().trim().min(1),
  retailerId: z.string().trim().min(1),
  partnerId: z.string().trim().min(1),

  status: RetailMediaPartnerMembershipStatusSchema,
  permissions: RetailMediaPartnerPermissionsSchema,

  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().trim().min(1),
  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().trim().min(1),
});

export type RetailMediaPartnerMembership = z.infer<
  typeof RetailMediaPartnerMembershipSchema
>;
