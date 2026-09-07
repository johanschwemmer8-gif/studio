import {
  CanonicalRole,
  Permissions,
  AuthorizationScope,
  UserAuthorizationProfile,
} from './auth-types';
import { isRoleScopeValid } from './authorization';

const ALL_PERMISSIONS: Permissions = {
  dashboard: true,
  roi: true,
  visualsReporting: true,
  realTime: true,
  abTesting: true,
  systemIntegration: true,
  retailMediaNetwork: true,
  manageUsers: true,
  manageOrganization: true,
  approve: true,
  export: true,
};

const NO_ADMIN_PERMISSIONS: Permissions = {
  dashboard: false,
  roi: false,
  visualsReporting: false,
  realTime: false,
  abTesting: false,
  systemIntegration: false,
  retailMediaNetwork: false,
  manageUsers: false,
  manageOrganization: false,
  approve: false,
  export: false,
};

function permissions(
  overrides: Partial<Permissions>
): Permissions {
  return {
    ...NO_ADMIN_PERMISSIONS,
    ...overrides,
  };
}

export function getDefaultPermissions(role: CanonicalRole): Permissions {
  switch (role) {
    case 'networkOwner':
      return {
        ...ALL_PERMISSIONS,
      };

    case 'networkAdmin':
      return permissions({
        dashboard: true,
        roi: true,
        visualsReporting: true,
        realTime: true,
        abTesting: true,
        systemIntegration: true,
        retailMediaNetwork: true,
        manageUsers: true,
        manageOrganization: true,
        export: true,
      });

    case 'brandManager':
      return permissions({
        dashboard: true,
        roi: true,
        visualsReporting: true,
        realTime: true,
        retailMediaNetwork: true,
        manageUsers: true,
        export: true,
      });

    case 'divisionManager':
    case 'regionalManager':
      return permissions({
        dashboard: true,
        roi: true,
        visualsReporting: true,
        realTime: true,
        manageUsers: true,
        export: true,
      });

    case 'areaManager':
      return permissions({
        dashboard: true,
        roi: true,
        visualsReporting: true,
        manageUsers: true,
        export: true,
      });

    case 'storeManager':
      return permissions({
        dashboard: true,
        roi: true,
        visualsReporting: true,
        realTime: true,
        manageUsers: true,
        export: true,
      });

    case 'storeUser':
      return permissions({
        dashboard: true,
      });

    case 'analyst':
      return permissions({
        dashboard: true,
        roi: true,
        visualsReporting: true,
        export: true,
      });
  }
}

export function isPermissionsValid(
  value: unknown
): value is Permissions {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    Object.keys(NO_ADMIN_PERMISSIONS).every(
      key => typeof candidate[key] === 'boolean'
    )
  );
}

export function createUserAuthorizationProfile(input: {
  uid: string;
  retailerId: string;
  displayName: string;
  email: string;
  role: CanonicalRole;
  scope: AuthorizationScope;
  permissions?: Partial<Permissions>;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
}): UserAuthorizationProfile {
  if (!input.uid) {
    throw new Error('User UID is required.');
  }

  if (!input.retailerId) {
    throw new Error('Retailer ID is required.');
  }

  if (!input.displayName.trim()) {
    throw new Error('Display name is required.');
  }

  if (!input.email.trim()) {
    throw new Error('Email is required.');
  }

  if (!isRoleScopeValid(input.role, input.scope)) {
    throw new Error('Role and scope are inconsistent.');
  }

  const finalPermissions: Permissions = {
    ...getDefaultPermissions(input.role),
    ...(input.permissions || {}),
  };

  if (!isPermissionsValid(finalPermissions)) {
    throw new Error('Invalid permission set.');
  }

  return {
    uid: input.uid,
    retailerId: input.retailerId,
    displayName: input.displayName.trim(),
    email: input.email.trim(),
    role: input.role,
    scope: input.scope,
    permissions: finalPermissions,
    isActive: input.isActive ?? true,
    createdBy: input.createdBy,
    updatedBy: input.updatedBy,
  };
}
