import type {
  AuthorizationScope,
  CanonicalRole,
} from './auth-types';
import {
  RETAILER_FUNCTIONAL_AREA_IDS,
  type SidebarAccess,
} from './retailer-navigation';
import { constrainSidebarAccessForRole } from './retailer-sidebar-access';

export function authorizationScopesEqual(
  left: AuthorizationScope,
  right: AuthorizationScope
): boolean {
  return (
    left.level === right.level &&
    left.networkId === right.networkId &&
    left.brandId === right.brandId &&
    left.divisionId === right.divisionId &&
    left.regionId === right.regionId &&
    left.areaId === right.areaId &&
    left.storeId === right.storeId
  );
}

/**
 * Initial Sidebar Access for the edit form.
 *
 * undefined = legacy profile, whose current effective runtime access is all
 * canonical areas subject to the selected role's proven eligibility ceiling.
 *
 * [] remains explicitly no access.
 *
 * A populated assignment remains exactly that assignment, reduced only by
 * canonical role eligibility.
 */
export function initialSidebarAccessForEdit(
  role: CanonicalRole,
  sidebarAccess: SidebarAccess | undefined
): SidebarAccess {
  const effectiveAccess =
    sidebarAccess === undefined
      ? [...RETAILER_FUNCTIONAL_AREA_IDS]
      : [...sidebarAccess];

  return constrainSidebarAccessForRole(role, effectiveAccess);
}
