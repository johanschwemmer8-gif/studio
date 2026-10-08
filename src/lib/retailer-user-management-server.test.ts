import {
  buildRetailerManagedUserProfile,
  requireRetailerTargetManagement,
  requireRetailerUserManager,
} from './retailer-user-management-server';
import {
  type AuthorizedContext,
  type UserAuthorizationProfile,
} from './auth-types';
import { getDefaultPermissions } from './user-profile';

function networkOwnerActor(
  overrides: Partial<AuthorizedContext> = {}
): AuthorizedContext {
  return {
    uid: 'owner-1',
    retailerId: 'retailer-1',
    role: 'networkOwner',
    scope: {
      level: 'network',
      networkId: 'retailer-1',
    },
    permissions: getDefaultPermissions('networkOwner'),
    sidebarAccess: undefined,
    isActive: true,
    ...overrides,
  };
}

function networkAdminActor(
  overrides: Partial<AuthorizedContext> = {}
): AuthorizedContext {
  return {
    uid: 'admin-1',
    retailerId: 'retailer-1',
    role: 'networkAdmin',
    scope: {
      level: 'network',
      networkId: 'retailer-1',
    },
    permissions: getDefaultPermissions('networkAdmin'),
    sidebarAccess: undefined,
    isActive: true,
    ...overrides,
  };
}

function storeManagerTarget(
  overrides: Partial<UserAuthorizationProfile> = {}
): UserAuthorizationProfile {
  return {
    uid: 'manager-1',
    retailerId: 'retailer-1',
    displayName: 'Store Manager',
    email: 'manager@example.com',
    role: 'storeManager',
    scope: {
      level: 'store',
      networkId: 'retailer-1',
      brandId: 'brand-1',
      divisionId: 'division-1',
      regionId: 'region-1',
      areaId: 'area-1',
      storeId: 'store-1',
    },
    permissions: getDefaultPermissions('storeManager'),
    sidebarAccess: ['dashboard', 'products'],
    isActive: true,
    ...overrides,
  };
}

describe('retailer user management authority kernel', () => {
  test('requires an active retailer actor with manageUsers permission', () => {
    expect(() =>
      requireRetailerUserManager(
        networkOwnerActor({
          isActive: false,
        })
      )
    ).toThrow('USER_MANAGEMENT_FORBIDDEN');

    expect(() =>
      requireRetailerUserManager(
        networkOwnerActor({
          retailerId: undefined,
        })
      )
    ).toThrow('USER_MANAGEMENT_FORBIDDEN');

    expect(() =>
      requireRetailerUserManager(
        networkOwnerActor({
          permissions: {
            ...getDefaultPermissions('networkOwner'),
            manageUsers: false,
          },
        })
      )
    ).toThrow('USER_MANAGEMENT_FORBIDDEN');
  });

  test('builds a manageable target using role-derived permissions', () => {
    const actor = networkOwnerActor();

    const profile = buildRetailerManagedUserProfile(actor, {
      uid: 'manager-1',
      retailerId: 'retailer-1',
      displayName: 'Store Manager',
      email: 'manager@example.com',
      role: 'storeManager',
      scope: {
        level: 'store',
        networkId: 'retailer-1',
        brandId: 'brand-1',
        divisionId: 'division-1',
        regionId: 'region-1',
        areaId: 'area-1',
        storeId: 'store-1',
      },
      sidebarAccess: ['dashboard', 'products'],
      createdBy: actor.uid,
      updatedBy: actor.uid,
    });

    expect(profile.permissions).toEqual(
      getDefaultPermissions('storeManager')
    );
    expect(profile.sidebarAccess).toEqual(['dashboard', 'products']);
    expect(profile.retailerId).toBe('retailer-1');
  });

  test('rejects a client-supplied cross-tenant target', () => {
    expect(() =>
      buildRetailerManagedUserProfile(networkOwnerActor(), {
        uid: 'manager-2',
        retailerId: 'retailer-2',
        displayName: 'Foreign Manager',
        email: 'foreign@example.com',
        role: 'storeManager',
        scope: {
          level: 'store',
          networkId: 'retailer-2',
          brandId: 'brand-2',
          divisionId: 'division-2',
          regionId: 'region-2',
          areaId: 'area-2',
          storeId: 'store-2',
        },
      })
    ).toThrow(
      'USER_MANAGEMENT_FORBIDDEN: Target retailer must match the authenticated actor.'
    );
  });

  test('rejects malformed sidebar access', () => {
    expect(() =>
      buildRetailerManagedUserProfile(networkOwnerActor(), {
        uid: 'manager-1',
        retailerId: 'retailer-1',
        displayName: 'Store Manager',
        email: 'manager@example.com',
        role: 'storeManager',
        scope: {
          level: 'store',
          networkId: 'retailer-1',
          brandId: 'brand-1',
          divisionId: 'division-1',
          regionId: 'region-1',
          areaId: 'area-1',
          storeId: 'store-1',
        },
        sidebarAccess: ['dashboard', 'not-real'] as any,
      })
    ).toThrow(
      'USER_MANAGEMENT_INVALID: Invalid sidebar access assignment.'
    );
  });

  test('rejects an equal-authority target', () => {
    const actor = networkAdminActor();

    expect(() =>
      buildRetailerManagedUserProfile(actor, {
        uid: 'other-admin',
        retailerId: 'retailer-1',
        displayName: 'Other Admin',
        email: 'other-admin@example.com',
        role: 'networkAdmin',
        scope: {
          level: 'network',
          networkId: 'retailer-1',
        },
      })
    ).toThrow('Target role has equal or higher authority.');
  });

  test('rejects a higher-authority target', () => {
    const actor = networkAdminActor();

    expect(() =>
      buildRetailerManagedUserProfile(actor, {
        uid: 'owner-2',
        retailerId: 'retailer-1',
        displayName: 'Owner',
        email: 'owner@example.com',
        role: 'networkOwner',
        scope: {
          level: 'network',
          networkId: 'retailer-1',
        },
      })
    ).toThrow('Target role has equal or higher authority.');
  });

  test('rejects a target outside the actor organisational scope', () => {
    const actor: AuthorizedContext = {
      uid: 'brand-manager-1',
      retailerId: 'retailer-1',
      role: 'brandManager',
      scope: {
        level: 'brand',
        networkId: 'retailer-1',
        brandId: 'brand-1',
      },
      permissions: {
        ...getDefaultPermissions('brandManager'),
        manageUsers: true,
      },
      isActive: true,
    };

    expect(() =>
      buildRetailerManagedUserProfile(actor, {
        uid: 'manager-2',
        retailerId: 'retailer-1',
        displayName: 'Other Brand Manager',
        email: 'other-brand@example.com',
        role: 'storeManager',
        scope: {
          level: 'store',
          networkId: 'retailer-1',
          brandId: 'brand-2',
          divisionId: 'division-2',
          regionId: 'region-2',
          areaId: 'area-2',
          storeId: 'store-2',
        },
      })
    ).toThrow('Target user is outside the actor scope.');
  });

  test('authorizes management of an existing lower-authority target', () => {
    expect(() =>
      requireRetailerTargetManagement(
        networkOwnerActor(),
        storeManagerTarget()
      )
    ).not.toThrow();
  });

  test('rejects management of an existing cross-tenant target', () => {
    expect(() =>
      requireRetailerTargetManagement(
        networkOwnerActor(),
        storeManagerTarget({
          retailerId: 'retailer-2',
        })
      )
    ).toThrow('Target user belongs to a different retailer.');
  });

  test('does not expose arbitrary permissions as proposed-user input', () => {
    const source = require('fs').readFileSync(
      require.resolve('./retailer-user-management-server'),
      'utf8'
    );

    const proposedType = source.slice(
      source.indexOf('export type ProposedRetailerUserAuthorization'),
      source.indexOf('export function requireRetailerUserManager')
    );

    expect(proposedType).not.toContain('permissions:');
    expect(proposedType).not.toContain('permissions?:');
  });
});
