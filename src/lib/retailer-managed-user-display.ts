import type {
  AuthorizationScope,
  CanonicalRole,
} from './auth-types';
import type { SidebarAccess } from './retailer-navigation';

export const RETAILER_ROLE_LABELS: Record<CanonicalRole, string> = {
  networkOwner: 'Network Owner',
  networkAdmin: 'Network Admin',
  brandManager: 'Brand Manager',
  divisionManager: 'Division Manager',
  regionalManager: 'Regional Manager',
  areaManager: 'Area Manager',
  storeManager: 'Store Manager',
  storeUser: 'Store User',
  analyst: 'Analyst',
};

export function retailerRoleLabel(role: CanonicalRole): string {
  return RETAILER_ROLE_LABELS[role];
}

export function retailerScopeLevelLabel(
  scope: AuthorizationScope
): string {
  switch (scope.level) {
    case 'network':
      return 'Network';
    case 'brand':
      return 'Brand';
    case 'division':
      return 'Division';
    case 'region':
      return 'Region';
    case 'area':
      return 'Area';
    case 'store':
      return 'Store';
  }
}

export function retailerSidebarAccessSummary(
  sidebarAccess: SidebarAccess | undefined,
  totalAreas: number
): string {
  if (sidebarAccess === undefined) {
    return 'Legacy access';
  }

  return `${sidebarAccess.length} of ${totalAreas}`;
}

export function retailerUserStatusLabel(
  isActive: boolean
): 'Active' | 'Suspended' {
  return isActive ? 'Active' : 'Suspended';
}
