import type { AuthorizationDecision } from './auth-types';
import type {
  RetailMediaPartnerMembership,
  RetailMediaPartnerPermissions,
} from './schemas/retail-media-partner-membership';

export type RetailMediaPartnerPermission =
  keyof RetailMediaPartnerPermissions;

export type RetailMediaPartnerResource = {
  retailerId: string;
  partnerId: string;
};

/**
 * Pure Retail Media Partner authorization kernel.
 *
 * ARCHITECTURE:
 * - External Retail Media Partner authorization is separate from the retailer
 *   organizational role/scope hierarchy.
 * - Permissions never expand retailer or Partner scope.
 * - Both retailerId and partnerId are mandatory authorization boundaries.
 * - Resource IDs are never trusted to establish access by themselves.
 *
 * This function performs no Firebase or Firestore I/O. Server-side membership,
 * Partner, and resource loading must occur before this decision is evaluated.
 */
export function canAccessRetailMediaPartnerResource(
  membership: RetailMediaPartnerMembership,
  resource: RetailMediaPartnerResource,
  permission: RetailMediaPartnerPermission
): AuthorizationDecision {
  if (membership.status !== 'ACTIVE') {
    return {
      allowed: false,
      reason: 'Retail Media Partner membership is inactive.',
    };
  }

  if (membership.permissions[permission] !== true) {
    return {
      allowed: false,
      reason: 'Retail Media Partner permission is not granted.',
    };
  }

  if (membership.retailerId !== resource.retailerId) {
    return {
      allowed: false,
      reason: 'Retail Media resource belongs to a different retailer.',
    };
  }

  if (membership.partnerId !== resource.partnerId) {
    return {
      allowed: false,
      reason: 'Retail Media resource belongs to a different Partner.',
    };
  }

  return {
    allowed: true,
  };
}
