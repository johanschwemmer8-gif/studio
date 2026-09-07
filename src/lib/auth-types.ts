/**
 * Canonical authorization types for iNteract.
 *
 * This file contains types only.
 * It does not perform authorization and does not change runtime behaviour.
 */

/**
 * Canonical platform and retailer roles.
 *
 * `platformAdmin` is the iNteract platform-level administrator.
 * All other roles operate within a retailer/network hierarchy.
 */
export type CanonicalRole =
  | 'platformAdmin'
  | 'networkOwner'
  | 'networkAdmin'
  | 'brandManager'
  | 'divisionManager'
  | 'regionalManager'
  | 'areaManager'
  | 'storeManager'
  | 'storeUser'
  | 'analyst';

/**
 * Legacy roles retained only as migration-compatible values.
 *
 * These should not be used for new authorization records.
 */
export type LegacyRole =
  | 'admin'
  | 'retailerAdmin';

/**
 * Scope levels correspond directly to the iNteract organization hierarchy.
 */
export type ScopeLevel =
  | 'platform'
  | 'network'
  | 'brand'
  | 'division'
  | 'region'
  | 'area'
  | 'store';

/**
 * A user's authorization scope.
 *
 * The selected node implicitly includes its descendants.
 * Names are deliberately excluded: stable organization IDs are authoritative.
 */
export type AuthorizationScope = {
  level: ScopeLevel;

  networkId?: string;
  brandId?: string;
  divisionId?: string;
  regionId?: string;
  areaId?: string;
  storeId?: string;
};

/**
 * Functional permissions available to users.
 *
 * The existing seven permissions are retained.
 * Administrative permissions are included for the authorization model.
 */
export type Permissions = {
  dashboard: boolean;
  roi: boolean;
  visualsReporting: boolean;
  realTime: boolean;
  abTesting: boolean;
  systemIntegration: boolean;
  retailMediaNetwork: boolean;

  manageUsers: boolean;
  manageOrganization: boolean;
  approve: boolean;
  export: boolean;
};

/**
 * Authoritative retailer-side authorization profile.
 *
 * Stored conceptually at:
 * /users/{uid}
 */
export type UserAuthorizationProfile = {
  uid: string;

  retailerId: string;

  displayName: string;
  email: string;

  role: CanonicalRole;
  scope: AuthorizationScope;
  permissions: Permissions;

  isActive: boolean;

  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
  updatedBy?: string;
};

/**
 * Normalized authorization context used by server-side authorization.
 *
 * This is derived from the authenticated identity plus the authoritative
 * /users/{uid} authorization profile.
 */
export type AuthorizedContext = {
  uid: string;

  retailerId?: string;

  role: CanonicalRole;
  scope: AuthorizationScope;
  permissions: Permissions;

  isActive: boolean;

  error?: string;
};

/**
 * Role authority order.
 *
 * Higher numeric values represent greater administrative authority.
 * Analyst is intentionally treated as a functional role rather than
 * a management hierarchy role.
 */
export const ROLE_AUTHORITY: Record<CanonicalRole, number> = {
  platformAdmin: 100,

  networkOwner: 90,
  networkAdmin: 80,

  brandManager: 70,
  divisionManager: 60,
  regionalManager: 50,
  areaManager: 40,
  storeManager: 30,
  storeUser: 20,

  analyst: 10,
};

/**
 * Canonical role-to-scope mapping.
 */
export const ROLE_SCOPE_LEVEL: Partial<Record<CanonicalRole, ScopeLevel>> = {
  platformAdmin: 'platform',

  networkOwner: 'network',
  networkAdmin: 'network',

  brandManager: 'brand',
  divisionManager: 'division',
  regionalManager: 'region',
  areaManager: 'area',
  storeManager: 'store',
  storeUser: 'store',

  /**
   * Analysts receive an explicitly assigned scope.
   * Their actual scope is therefore not inferred from the role.
   */
};

/**
 * Permission names as a reusable union type.
 */
export type Permission = keyof Permissions;

/**
 * Authorization result used by future authorization helpers.
 */
export type AuthorizationDecision = {
  allowed: boolean;
  reason?: string;
};
