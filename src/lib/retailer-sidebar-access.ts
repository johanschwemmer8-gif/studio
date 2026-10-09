import type {
  CanonicalRole,
  Permissions,
} from './auth-types';
import {
  RETAILER_NAVIGATION,
  RETAILER_NAVIGATION_GROUPS,
  type RetailerFunctionalArea,
  type RetailerNavigationGroup,
  type RetailerNavigationItem,
  type SidebarAccess,
} from './retailer-navigation';
import { getDefaultPermissions } from './user-profile';

export type RetailerSidebarAccessOption = {
  item: RetailerNavigationItem;
  eligible: boolean;
  unavailableReason?: 'Not available for this role';
};

export type RetailerSidebarAccessGroup = {
  group: RetailerNavigationGroup;
  options: RetailerSidebarAccessOption[];
};

function rolePermissions(role: CanonicalRole): Permissions {
  return getDefaultPermissions(role);
}

/**
 * Sidebar Access is a functional-surface assignment.
 *
 * It never creates role authority, organisational scope, permissions,
 * or backend capabilities.
 *
 * R3.4.3 has one proven role-derived ceiling:
 * - User Access requires manageUsers.
 *
 * No role ceiling is invented for the other canonical functional areas.
 */
export function isRetailerSidebarAreaEligibleForRole(
  role: CanonicalRole,
  area: RetailerFunctionalArea
): boolean {
  if (area === 'userAccess') {
    return rolePermissions(role).manageUsers === true;
  }

  return true;
}

export function getRetailerSidebarAccessGroups(
  role: CanonicalRole
): RetailerSidebarAccessGroup[] {
  return RETAILER_NAVIGATION_GROUPS.map(group => ({
    group,
    options: RETAILER_NAVIGATION
      .filter(item => item.group === group)
      .map(item => {
        const eligible = isRetailerSidebarAreaEligibleForRole(
          role,
          item.id
        );

        return {
          item,
          eligible,
          ...(eligible
            ? {}
            : {
                unavailableReason:
                  'Not available for this role' as const,
              }),
        };
      }),
  }));
}

/**
 * Removes assignments that the selected role cannot hold.
 *
 * This can only reduce Sidebar Access. It cannot grant anything.
 */
export function constrainSidebarAccessForRole(
  role: CanonicalRole,
  sidebarAccess: SidebarAccess
): SidebarAccess {
  return sidebarAccess.filter(area =>
    isRetailerSidebarAreaEligibleForRole(role, area)
  );
}
