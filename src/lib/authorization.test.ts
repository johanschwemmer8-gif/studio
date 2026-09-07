import {
  canAccessScope,
  canManageRole,
  canManageUser,
  hasPermission,
  isRoleScopeValid,
  isScopeWithin,
} from './authorization';
import {
  AuthorizationScope,
  AuthorizedContext,
  Permissions,
  UserAuthorizationProfile,
} from './auth-types';

const permissions: Permissions = {
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

const networkScope: AuthorizationScope = {
  level: 'network',
  networkId: 'network-1',
};

const brandScope: AuthorizationScope = {
  level: 'brand',
  networkId: 'network-1',
  brandId: 'brand-1',
};

const divisionScope: AuthorizationScope = {
  level: 'division',
  networkId: 'network-1',
  brandId: 'brand-1',
  divisionId: 'division-1',
};

const regionScope: AuthorizationScope = {
  level: 'region',
  networkId: 'network-1',
  brandId: 'brand-1',
  divisionId: 'division-1',
  regionId: 'region-1',
};

const areaScope: AuthorizationScope = {
  level: 'area',
  networkId: 'network-1',
  brandId: 'brand-1',
  divisionId: 'division-1',
  regionId: 'region-1',
  areaId: 'area-1',
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

function makeContext(
  role: AuthorizedContext['role'],
  scope: AuthorizationScope,
  overrides: Partial<AuthorizedContext> = {}
): AuthorizedContext {
  return {
    uid: 'actor-1',
    retailerId: 'retailer-1',
    role,
    scope,
    permissions,
    isActive: true,
    ...overrides,
  };
}

function makeTarget(
  role: UserAuthorizationProfile['role'],
  scope: AuthorizationScope,
  overrides: Partial<UserAuthorizationProfile> = {}
): UserAuthorizationProfile {
  return {
    uid: 'target-1',
    retailerId: 'retailer-1',
    displayName: 'Target User',
    email: 'target@example.com',
    role,
    scope,
    permissions,
    isActive: true,
    ...overrides,
  };
}

describe('isScopeWithin', () => {
  test('platform scope contains every scope', () => {
    expect(isScopeWithin(storeScope, { level: 'platform' })).toBe(true);
  });

  test('platform scope cannot be contained by a retailer scope', () => {
    expect(isScopeWithin({ level: 'platform' }, networkScope)).toBe(false);
  });

  test('network scope contains descendants in the same network', () => {
    expect(isScopeWithin(brandScope, networkScope)).toBe(true);
    expect(isScopeWithin(storeScope, networkScope)).toBe(true);
  });

  test('network scope rejects a different network', () => {
    expect(
      isScopeWithin(
        { ...brandScope, networkId: 'network-2' },
        networkScope
      )
    ).toBe(false);
  });

  test('brand scope contains descendants of the same brand', () => {
    expect(isScopeWithin(storeScope, brandScope)).toBe(true);
  });

  test('brand scope rejects another brand', () => {
    expect(
      isScopeWithin(
        { ...storeScope, brandId: 'brand-2' },
        brandScope
      )
    ).toBe(false);
  });

  test('a descendant cannot contain its ancestor', () => {
    expect(isScopeWithin(brandScope, storeScope)).toBe(false);
  });

  test('division scope contains only matching descendants', () => {
    expect(isScopeWithin(regionScope, divisionScope)).toBe(true);
    expect(
      isScopeWithin(
        { ...regionScope, divisionId: 'division-2' },
        divisionScope
      )
    ).toBe(false);
  });

  test('missing required scope IDs fail closed', () => {
    expect(
      isScopeWithin(
        { level: 'brand', networkId: 'network-1', brandId: 'brand-1' },
        {
          level: 'brand',
          networkId: 'network-1',
          brandId: '',
        }
      )
    ).toBe(false);
  });
});

describe('canManageRole', () => {
  test('platformAdmin can manage every non-platform role', () => {
    expect(canManageRole('platformAdmin', 'networkOwner')).toBe(true);
    expect(canManageRole('platformAdmin', 'analyst')).toBe(true);
  });

  test('platformAdmin cannot manage another platformAdmin', () => {
    expect(canManageRole('platformAdmin', 'platformAdmin')).toBe(false);
  });

  test('a role cannot manage an equal or higher authority role', () => {
    expect(canManageRole('brandManager', 'brandManager')).toBe(false);
    expect(canManageRole('brandManager', 'networkAdmin')).toBe(false);
  });

  test('a higher retailer role can manage a lower retailer role', () => {
    expect(canManageRole('brandManager', 'storeManager')).toBe(true);
    expect(canManageRole('networkAdmin', 'brandManager')).toBe(true);
  });
});

describe('isRoleScopeValid', () => {
  test('platformAdmin requires platform scope with no hierarchy IDs', () => {
    expect(isRoleScopeValid('platformAdmin', { level: 'platform' })).toBe(true);
    expect(
      isRoleScopeValid('platformAdmin', {
        level: 'platform',
        networkId: 'network-1',
      })
    ).toBe(false);
  });

  test('network roles require a network ID', () => {
    expect(isRoleScopeValid('networkAdmin', networkScope)).toBe(true);
    expect(isRoleScopeValid('networkAdmin', { level: 'network' })).toBe(false);
  });

  test('manager roles require their matching hierarchy level and ancestors', () => {
    expect(isRoleScopeValid('brandManager', brandScope)).toBe(true);
    expect(isRoleScopeValid('brandManager', networkScope)).toBe(false);
    expect(isRoleScopeValid('divisionManager', divisionScope)).toBe(true);
    expect(
      isRoleScopeValid('divisionManager', {
        level: 'division',
        networkId: 'network-1',
        divisionId: 'division-1',
      })
    ).toBe(false);
  });

  test('analyst requires an explicit non-platform scope', () => {
    expect(isRoleScopeValid('analyst', storeScope)).toBe(true);
    expect(isRoleScopeValid('analyst', networkScope)).toBe(true);
    expect(isRoleScopeValid('analyst', { level: 'platform' })).toBe(false);
  });
});

describe('hasPermission', () => {
  test('active users receive enabled permissions', () => {
    const actor = makeContext('storeUser', storeScope);
    expect(hasPermission(actor, 'dashboard')).toBe(true);
  });

  test('disabled permissions are denied', () => {
    const actor = makeContext('storeUser', storeScope, {
      permissions: { ...permissions, export: false },
    });
    expect(hasPermission(actor, 'export')).toBe(false);
  });

  test('inactive users have no permissions', () => {
    const actor = makeContext('storeUser', storeScope, {
      isActive: false,
    });
    expect(hasPermission(actor, 'dashboard')).toBe(false);
  });
});

describe('canManageUser', () => {
  test('platformAdmin can manage a non-platform user without manageUsers permission', () => {
    const actor = makeContext('platformAdmin', { level: 'platform' }, {
      permissions: { ...permissions, manageUsers: false },
    });
    const target = makeTarget('networkAdmin', networkScope);

    expect(canManageUser(actor, target)).toEqual({ allowed: true });
  });

  test('platformAdmin cannot manage another platformAdmin', () => {
    const actor = makeContext('platformAdmin', { level: 'platform' });
    const target = makeTarget('platformAdmin', { level: 'platform' });

    expect(canManageUser(actor, target).allowed).toBe(false);
  });

  test('retailer manager requires manageUsers permission', () => {
    const actor = makeContext('brandManager', brandScope, {
      permissions: { ...permissions, manageUsers: false },
    });
    const target = makeTarget('storeManager', storeScope);

    expect(canManageUser(actor, target).allowed).toBe(false);
  });

  test('retailer manager can manage a lower role within scope', () => {
    const actor = makeContext('brandManager', brandScope);
    const target = makeTarget('storeManager', storeScope);

    expect(canManageUser(actor, target)).toEqual({ allowed: true });
  });

  test('retailer manager cannot manage a higher role', () => {
    const actor = makeContext('brandManager', brandScope);
    const target = makeTarget('networkAdmin', networkScope);

    expect(canManageUser(actor, target).allowed).toBe(false);
  });

  test('retailer manager cannot manage a user outside scope', () => {
    const actor = makeContext('brandManager', brandScope);
    const target = makeTarget('storeManager', {
      ...storeScope,
      brandId: 'brand-2',
    });

    expect(canManageUser(actor, target).allowed).toBe(false);
  });

  test('retailer mismatch is denied', () => {
    const actor = makeContext('networkAdmin', networkScope);
    const target = makeTarget('brandManager', brandScope, {
      retailerId: 'retailer-2',
    });

    expect(canManageUser(actor, target).allowed).toBe(false);
  });

  test('inactive actor is denied', () => {
    const actor = makeContext('brandManager', brandScope, {
      isActive: false,
    });
    const target = makeTarget('storeManager', storeScope);

    expect(canManageUser(actor, target).allowed).toBe(false);
  });

  test('invalid target role and scope is denied', () => {
    const actor = makeContext('brandManager', brandScope);
    const target = makeTarget('storeManager', brandScope);

    expect(canManageUser(actor, target).allowed).toBe(false);
  });
});

describe('canAccessScope', () => {
  test('platformAdmin can access any scope', () => {
    const actor = makeContext('platformAdmin', { level: 'platform' });
    expect(
      canAccessScope(actor, {
        level: 'store',
        networkId: 'network-99',
        brandId: 'brand-99',
        divisionId: 'division-99',
        regionId: 'region-99',
        areaId: 'area-99',
        storeId: 'store-99',
      })
    ).toEqual({ allowed: true });
  });

  test('manager can access their own scope and descendants', () => {
    const actor = makeContext('brandManager', brandScope);

    expect(canAccessScope(actor, brandScope)).toEqual({ allowed: true });
    expect(canAccessScope(actor, storeScope)).toEqual({ allowed: true });
  });

  test('manager cannot access a sibling scope', () => {
    const actor = makeContext('brandManager', brandScope);

    expect(
      canAccessScope(actor, {
        ...storeScope,
        brandId: 'brand-2',
      }).allowed
    ).toBe(false);
  });

  test('manager cannot access an ancestor scope', () => {
    const actor = makeContext('storeManager', storeScope);

    expect(canAccessScope(actor, brandScope).allowed).toBe(false);
  });

  test('missing retailer assignment is denied', () => {
    const actor = makeContext('brandManager', brandScope, {
      retailerId: undefined,
    });

    expect(canAccessScope(actor, storeScope).allowed).toBe(false);
  });
});
