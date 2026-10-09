import {
  getRetailerUserScopeChildren,
  getRetailerUserScopeContext,
} from './retailer-user-scope-options-server';
import { verifyAuth } from './auth-server';
import { listOrganizationScopeChildren } from './organization-scope-server';

jest.mock('./auth-server', () => ({
  verifyAuth: jest.fn(),
}));

jest.mock('./organization-scope-server', () => ({
  listOrganizationScopeChildren: jest.fn(),
}));

const mockVerifyAuth = verifyAuth as jest.Mock;
const mockListChildren = listOrganizationScopeChildren as jest.Mock;

const permissions = {
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

function networkOwnerActor() {
  return {
    uid: 'owner_1',
    retailerId: 'retailer_a',
    role: 'networkOwner' as const,
    scope: {
      level: 'network' as const,
      networkId: 'network_a',
    },
    permissions,
    isActive: true,
  };
}

describe('retailer user scope options server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('derives eligible roles from the authoritative actor', async () => {
    mockVerifyAuth.mockResolvedValue(networkOwnerActor());

    const result = await getRetailerUserScopeContext('token');

    expect(result.actorRole).toBe('networkOwner');
    expect(result.actorScope).toEqual({
      level: 'network',
      networkId: 'network_a',
    });

    expect(result.eligibleRoles).toEqual([
      'networkAdmin',
      'brandManager',
      'divisionManager',
      'regionalManager',
      'areaManager',
      'storeManager',
      'storeUser',
      'analyst',
    ]);

    expect(result.eligibleRoles).not.toContain('networkOwner');
  });

  test('never accepts browser retailer authority when listing children', async () => {
    mockVerifyAuth.mockResolvedValue(networkOwnerActor());

    mockListChildren.mockResolvedValue([
      {
        scope: {
          level: 'brand',
          networkId: 'network_a',
          brandId: 'brand_a',
        },
        displayName: 'Brand A',
      },
    ]);

    const result = await getRetailerUserScopeChildren('token', {
      level: 'network',
      networkId: 'network_a',
    });

    expect(mockListChildren).toHaveBeenCalledWith(
      'retailer_a',
      {
        level: 'network',
        networkId: 'network_a',
      }
    );

    expect(result).toHaveLength(1);
  });

  test('rejects hierarchy traversal outside the actor scope', async () => {
    mockVerifyAuth.mockResolvedValue({
      ...networkOwnerActor(),
      role: 'regionalManager',
      scope: {
        level: 'region',
        networkId: 'network_a',
        brandId: 'brand_a',
        divisionId: 'division_a',
        regionId: 'region_a',
      },
      permissions: {
        ...permissions,
        manageOrganization: false,
        approve: false,
      },
    });

    await expect(
      getRetailerUserScopeChildren('token', {
        level: 'region',
        networkId: 'network_a',
        brandId: 'brand_b',
        divisionId: 'division_b',
        regionId: 'region_b',
      })
    ).rejects.toThrow('USER_SCOPE_OPTIONS_FORBIDDEN');

    expect(mockListChildren).not.toHaveBeenCalled();
  });

  test('rejects actors without user-management authority', async () => {
    mockVerifyAuth.mockResolvedValue({
      ...networkOwnerActor(),
      role: 'analyst',
      permissions: {
        ...permissions,
        manageUsers: false,
        manageOrganization: false,
        approve: false,
      },
    });

    await expect(
      getRetailerUserScopeContext('token')
    ).rejects.toThrow('USER_MANAGEMENT_FORBIDDEN');
  });

  test('fails closed when authentication fails', async () => {
    mockVerifyAuth.mockResolvedValue({
      uid: '',
      error: 'Authentication failed.',
    });

    await expect(
      getRetailerUserScopeContext('bad-token')
    ).rejects.toThrow('USER_SCOPE_OPTIONS_AUTH_FAILED');
  });
});
