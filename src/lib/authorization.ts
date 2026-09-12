import type { AuthorizedContext } from './auth-server';

/**
 * Canonical production-operation capabilities.
 * Authentication and tenant resolution remain authoritative in auth-server.ts.
 * This module defines WHAT an authenticated actor may do.
 */
export const AUTHORIZATION_CAPABILITIES = [
  'CAMPAIGN_CREATE',
  'CAMPAIGN_UPDATE',
  'CAMPAIGN_ARCHIVE',
  'ACTIVATION_CREATE',
  'ACTIVATION_UPDATE',
  'ACTIVATION_SUBMIT',
  'ACTIVATION_APPROVE',
  'ACTIVATION_SCHEDULE',
  'ACTIVATION_PAUSE',
  'ACTIVATION_END',
  'ACTIVATION_ARCHIVE',
  'DEPLOYMENT_CREATE',
  'DEPLOYMENT_ASSIGN',
  'DEPLOYMENT_MARK_PRINTED',
  'DEPLOYMENT_MARK_DEPLOYED',
  'DEPLOYMENT_REPORT_PROBLEM',
  'DEPLOYMENT_REMOVE',
  'QR_GENERATE',
  'QR_REPRINT',
  'ANALYTICS_VIEW',
] as const;

export type AuthorizationCapability =
  (typeof AUTHORIZATION_CAPABILITIES)[number];

export type AuthorizedRole = AuthorizedContext['role'];

export const ROLE_CAPABILITIES: Record<
  AuthorizedRole,
  readonly AuthorizationCapability[]
> = {
  admin: AUTHORIZATION_CAPABILITIES,
  retailerAdmin: AUTHORIZATION_CAPABILITIES,
  storeManager: [
    'DEPLOYMENT_MARK_PRINTED',
    'DEPLOYMENT_MARK_DEPLOYED',
    'DEPLOYMENT_REPORT_PROBLEM',
    'QR_REPRINT',
    'ANALYTICS_VIEW',
  ],
  analyst: [
    'ANALYTICS_VIEW',
  ],
};

export function hasCapability(
  role: AuthorizedRole,
  capability: AuthorizationCapability
): boolean {
  const allowedCapabilities = ROLE_CAPABILITIES[role];
  return allowedCapabilities.includes(capability);
}


export function requireCapability(
  role: AuthorizedRole,
  capability: AuthorizationCapability
): void {
  if (!hasCapability(role, capability)) {
    throw new Error(
      `ACCESS_DENIED: Role '${role}' is not authorized for capability '${capability}'.`
    );
  }
}
