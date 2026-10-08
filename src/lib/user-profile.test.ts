import {
  createUserAuthorizationProfile,
  getDefaultPermissions,
  isPermissionsValid,
} from './user-profile';

import {
  AuthorizationScope,
  Permissions,
} from './auth-types';

const networkScope: AuthorizationScope = {
  level: 'network',
  networkId: 'network-1',
};

const storeScope: AuthorizationScope = {
  level: 'store',
  networkId: 'network-1',
  brandId: 'brand-1',
  divisionId: 'division-1',
  regionId: 'region-1',
  areaId: 'area-1',
  storeId: 'store-1',
};

const allPermissions: Permissions = {
  dashboard: true,
  roi: true,
  visualsReporting: true,
  realTime: true,
  systemIntegration: true,
  retailMediaNetwork: true,
  manageUsers: true,
  manageOrganization: true,
  approve: true,
  export: true,
};

describe('user-profile', () => {
  test('networkOwner receives full retailer-level default permissions', () => {
    expect(getDefaultPermissions('networkOwner')).toEqual(allPermissions);
  });

  test('returns conservative permissions for storeUser', () => {
    const permissions = getDefaultPermissions('storeUser');

    expect(permissions.dashboard).toBe(true);
    expect(permissions.roi).toBe(false);
    expect(permissions.manageUsers).toBe(false);
    expect(permissions.manageOrganization).toBe(false);
  });

  test('returns analyst defaults without administrative permissions', () => {
    const permissions = getDefaultPermissions('analyst');

    expect(permissions.dashboard).toBe(true);
    expect(permissions.roi).toBe(true);
    expect(permissions.visualsReporting).toBe(true);
    expect(permissions.export).toBe(true);
    expect(permissions.manageUsers).toBe(false);
    expect(permissions.manageOrganization).toBe(false);
    expect(permissions.approve).toBe(false);
  });

  test('accepts a valid complete permission set', () => {
    expect(isPermissionsValid(allPermissions)).toBe(true);
  });

  test('rejects an incomplete permission set', () => {
    expect(
      isPermissionsValid({
        dashboard: true,
      })
    ).toBe(false);
  });

  test('creates a canonical profile with role defaults', () => {
    const profile = createUserAuthorizationProfile({
      uid: 'uid-1',
      retailerId: 'retailer-1',
      displayName: 'Test User',
      email: 'test@example.com',
      role: 'networkAdmin',
      scope: networkScope,
    });

    expect(profile.uid).toBe('uid-1');
    expect(profile.role).toBe('networkAdmin');
    expect(profile.scope).toEqual(networkScope);
    expect(profile.isActive).toBe(true);
    expect(profile.permissions.manageUsers).toBe(true);
    expect(profile.permissions.manageOrganization).toBe(true);
  });

  test('explicit permission overrides replace role defaults', () => {
    const profile = createUserAuthorizationProfile({
      uid: 'uid-2',
      retailerId: 'retailer-1',
      displayName: 'Test User',
      email: 'test@example.com',
      role: 'storeManager',
      scope: storeScope,
      permissions: {
        realTime: false,
        export: false,
      },
    });

    expect(profile.permissions.realTime).toBe(false);
    expect(profile.permissions.export).toBe(false);
    expect(profile.permissions.dashboard).toBe(true);
  });

  test('rejects an invalid role and scope combination', () => {
    expect(() =>
      createUserAuthorizationProfile({
        uid: 'uid-3',
        retailerId: 'retailer-1',
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'storeManager',
        scope: networkScope,
      })
    ).toThrow('Role and scope are inconsistent.');
  });


  it('preserves an explicit sidebar access assignment', () => {
    const profile = createUserAuthorizationProfile({
      uid: 'sidebar-user',
      retailerId: 'retailer-a',
      displayName: 'Sidebar User',
      email: 'sidebar@example.com',
      role: 'networkAdmin',
      scope: {
        level: 'network',
        networkId: 'retailer-a',
      },
      sidebarAccess: ['dashboard', 'products', 'qrManagement'],
    });

    expect(profile.sidebarAccess).toEqual([
      'dashboard',
      'products',
      'qrManagement',
    ]);
  });

  it('preserves missing sidebar access for legacy profiles', () => {
    const profile = createUserAuthorizationProfile({
      uid: 'legacy-user',
      retailerId: 'retailer-a',
      displayName: 'Legacy User',
      email: 'legacy@example.com',
      role: 'networkAdmin',
      scope: {
        level: 'network',
        networkId: 'retailer-a',
      },
    });

    expect(profile.sidebarAccess).toBeUndefined();
  });

  it('preserves an explicit empty sidebar access assignment', () => {
    const profile = createUserAuthorizationProfile({
      uid: 'no-sidebar-user',
      retailerId: 'retailer-a',
      displayName: 'No Sidebar User',
      email: 'none@example.com',
      role: 'networkAdmin',
      scope: {
        level: 'network',
        networkId: 'retailer-a',
      },
      sidebarAccess: [],
    });

    expect(profile.sidebarAccess).toEqual([]);
  });

  it('rejects an invalid sidebar access assignment', () => {
    expect(() =>
      createUserAuthorizationProfile({
        uid: 'invalid-sidebar-user',
        retailerId: 'retailer-a',
        displayName: 'Invalid Sidebar User',
        email: 'invalid@example.com',
        role: 'networkAdmin',
        scope: {
          level: 'network',
          networkId: 'retailer-a',
        },
        sidebarAccess: ['dashboard', 'not-real'] as any,
      })
    ).toThrow('Invalid sidebar access assignment.');
  });

});
