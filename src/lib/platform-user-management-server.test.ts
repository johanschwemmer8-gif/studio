import {
  buildPlatformManagedUserProfile,
  requireActivePlatformRetailer,
  requirePlatformUserAdministrator,
} from './platform-user-management-server';
import { getDefaultPermissions } from './user-profile';

const mockVerifyPlatformOperator = jest.fn();
const mockGetDb = jest.fn();

jest.mock('./auth-server', () => ({
  verifyPlatformOperator: (...args: unknown[]) =>
    mockVerifyPlatformOperator(...args),
}));

jest.mock('./firebase-admin', () => ({
  getDb: () => mockGetDb(),
}));

describe('platform user management authority kernel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requires authoritative Platform Operator verification', async () => {
    mockVerifyPlatformOperator.mockResolvedValue({
      uid: 'operator-1',
      email: 'operator@example.com',
    });

    const result = await requirePlatformUserAdministrator(
      'valid-token'
    );

    expect(mockVerifyPlatformOperator).toHaveBeenCalledWith(
      'valid-token'
    );
    expect(result.uid).toBe('operator-1');
  });

  test('rejects missing Platform Operator token before verification', async () => {
    await expect(
      requirePlatformUserAdministrator('')
    ).rejects.toThrow(
      'PLATFORM_USER_MANAGEMENT_AUTH_FAILED'
    );

    expect(mockVerifyPlatformOperator).not.toHaveBeenCalled();
  });

  test('rejects failed Platform Operator verification', async () => {
    mockVerifyPlatformOperator.mockRejectedValue(
      new Error('Not a Platform Operator')
    );

    await expect(
      requirePlatformUserAdministrator('invalid-token')
    ).rejects.toThrow(
      'PLATFORM_USER_MANAGEMENT_AUTH_FAILED'
    );
  });

  test('requires the explicitly selected retailer to exist and be active', async () => {
    const get = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        name: 'Retailer One',
        lifecycleStatus: 'ACTIVE',
        status: 'active',
      }),
    });

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        expect(name).toBe('tenants');

        return {
          doc: jest.fn((retailerId: string) => {
            expect(retailerId).toBe('retailer-1');
            return { get };
          }),
        };
      }),
    });

    await expect(
      requireActivePlatformRetailer('retailer-1')
    ).resolves.toEqual({
      retailerId: 'retailer-1',
      retailerName: 'Retailer One',
    });
  });

  test('rejects a missing selected retailer', async () => {
    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: false,
          }),
        })),
      })),
    });

    await expect(
      requireActivePlatformRetailer('missing-retailer')
    ).rejects.toThrow(
      'PLATFORM_USER_MANAGEMENT_NOT_FOUND'
    );
  });

  test('rejects an inactive selected retailer', async () => {
    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              name: 'Inactive Retailer',
              lifecycleStatus: 'SUSPENDED',
              status: 'active',
            }),
          }),
        })),
      })),
    });

    await expect(
      requireActivePlatformRetailer('inactive-retailer')
    ).rejects.toThrow(
      'PLATFORM_USER_MANAGEMENT_FORBIDDEN'
    );
  });

  test('builds canonical profile with role-derived permissions', () => {
    const profile = buildPlatformManagedUserProfile({
      uid: 'user-1',
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
      sidebarAccess: [
        'dashboard',
        'products',
        'qrManagement',
      ],
    });

    expect(profile.retailerId).toBe('retailer-1');
    expect(profile.role).toBe('storeManager');
    expect(profile.permissions).toEqual(
      getDefaultPermissions('storeManager')
    );
    expect(profile.sidebarAccess).toEqual([
      'dashboard',
      'products',
      'qrManagement',
    ]);
    expect(profile.isActive).toBe(true);
  });

  test('rejects scope belonging to another retailer', () => {
    expect(() =>
      buildPlatformManagedUserProfile({
        uid: 'user-1',
        retailerId: 'retailer-1',
        displayName: 'Foreign User',
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
        sidebarAccess: ['dashboard'],
      })
    ).toThrow(
      'Authorization scope does not belong to the selected retailer.'
    );
  });

  test('rejects malformed sidebar access', () => {
    expect(() =>
      buildPlatformManagedUserProfile({
        uid: 'user-1',
        retailerId: 'retailer-1',
        displayName: 'Invalid Sidebar User',
        email: 'invalid@example.com',
        role: 'analyst',
        scope: {
          level: 'network',
          networkId: 'retailer-1',
        },
        sidebarAccess: [
          'dashboard',
          'not-a-real-sidebar-item',
        ] as never,
      })
    ).toThrow(
      'PLATFORM_USER_MANAGEMENT_INVALID: Sidebar access is invalid.'
    );
  });
});
