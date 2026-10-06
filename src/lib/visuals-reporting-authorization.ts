import type { AuthorizationScope } from './auth-types';
import type { OrganizationScope } from './organization-scope-server';

const SCOPE_LEVELS = [
  'network',
  'brand',
  'division',
  'region',
  'area',
  'store',
] as const;

type ScopeLevel = (typeof SCOPE_LEVELS)[number];

const LEVEL_ID_FIELDS: Record<
  ScopeLevel,
  keyof Omit<AuthorizationScope, 'level'>
> = {
  network: 'networkId',
  brand: 'brandId',
  division: 'divisionId',
  region: 'regionId',
  area: 'areaId',
  store: 'storeId',
};

function levelIndex(level: ScopeLevel): number {
  return SCOPE_LEVELS.indexOf(level);
}

/**
 * Returns true only when requestedScope is the authenticated user's
 * authoritative home scope or one of its descendants.
 *
 * The function deliberately performs structural containment only.
 * Existence of the requested organisation node is separately validated by
 * resolveOrganizationScope(), which remains the canonical organisation
 * authority.
 */
export function isReportingScopeWithinAuthorizedScope(
  authorizedScope: AuthorizationScope,
  requestedScope: OrganizationScope,
): boolean {
  if (
    !authorizedScope.networkId ||
    !requestedScope.networkId ||
    authorizedScope.networkId !== requestedScope.networkId
  ) {
    return false;
  }

  // Visuals reporting never aggregates across sister-company Brands.
  // A concrete Brand must therefore be present on every report request.
  if (
    requestedScope.level === 'network' ||
    !requestedScope.brandId
  ) {
    return false;
  }

  // Network-scoped users may select any Brand inside their own network.
  // Existence and hierarchy integrity are still validated separately by
  // resolveOrganizationScope().
  if (authorizedScope.level === 'network') {
    return true;
  }

  // All other users are reporting-bound to their assigned Brand, while
  // remaining free to compare any organisational unit inside that Brand.
  if (!authorizedScope.brandId) {
    return false;
  }

  return authorizedScope.brandId === requestedScope.brandId;
}

export function assertReportingScopeAuthorized(
  authorizedScope: AuthorizationScope,
  requestedScope: OrganizationScope,
): void {
  if (
    !isReportingScopeWithinAuthorizedScope(
      authorizedScope,
      requestedScope,
    )
  ) {
    throw new Error('VISUALS_REPORTING_SCOPE_ACCESS_DENIED');
  }
}

/**
 * Completes omitted authoritative ancestry from the authenticated user's scope.
 *
 * Browser-supplied values are never overwritten. Any conflicting supplied
 * ancestry therefore remains visible to the strict containment check and is
 * rejected rather than silently corrected.
 */
export function canonicalizeReportingScope(
  authorizedScope: AuthorizationScope,
  requestedScope: OrganizationScope,
): OrganizationScope {
  const canonicalScope: OrganizationScope = {
    ...requestedScope,
  };

  // Visuals reporting authority is bounded by Network + Brand only.
  // Never borrow Division, Region, Area or Store ancestry from the
  // authenticated user's operational home scope.
  if (
    canonicalScope.networkId === undefined &&
    typeof authorizedScope.networkId === 'string'
  ) {
    canonicalScope.networkId = authorizedScope.networkId;
  }

  if (
    authorizedScope.level !== 'network' &&
    canonicalScope.brandId === undefined &&
    typeof authorizedScope.brandId === 'string'
  ) {
    canonicalScope.brandId = authorizedScope.brandId;
  }

  return canonicalScope;
}
