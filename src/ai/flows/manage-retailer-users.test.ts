jest.mock('@/lib/retailer-user-management-server', () => ({
  createRetailerUser: jest.fn(),
  listRetailerManagedUsers: jest.fn(),
  updateRetailerUserAuthorization: jest.fn(),
  suspendRetailerUser: jest.fn(),
  reactivateRetailerUser: jest.fn(),
}));

jest.mock('@/lib/organization-scope-server', () => ({
  listOrganizationScopeChildren: jest.fn(),
}));

jest.mock('@/lib/auth-server', () => ({
  verifyAuth: jest.fn(),
}));

import { createRetailerUser } from '@/lib/retailer-user-management-server';
import { createRetailerUserAction } from './manage-retailer-users';

const mockCreateRetailerUser =
  createRetailerUser as jest.MockedFunction<typeof createRetailerUser>;

describe('createRetailerUserAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns a serializable friendly result for duplicate email', async () => {
    const duplicateError = Object.assign(
      new Error('The email address is already in use by another account.'),
      { code: 'auth/email-already-in-use' }
    );

    mockCreateRetailerUser.mockRejectedValue(duplicateError);

    const result = await createRetailerUserAction({
      idToken: 'valid-token',
      displayName: 'Existing User',
      email: 'existing@example.com',
      password: 'temporary-password',
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
      sidebarAccess: ['dashboard'],
    });

    expect(result).toEqual({
      success: false,
      message:
        'This email address is already associated with an account. Please use another email address.',
    });
  });

  test('returns the created user on success', async () => {
    const user = {
      uid: 'new-user-1',
      displayName: 'New User',
      email: 'new@example.com',
      role: 'storeManager' as const,
      scope: {
        level: 'store' as const,
        networkId: 'retailer-1',
        brandId: 'brand-1',
        divisionId: 'division-1',
        regionId: 'region-1',
        areaId: 'area-1',
        storeId: 'store-1',
      },
      sidebarAccess: ['dashboard' as const],
      isActive: true,
    };

    mockCreateRetailerUser.mockResolvedValue(user);

    await expect(
      createRetailerUserAction({
        idToken: 'valid-token',
        displayName: 'New User',
        email: 'new@example.com',
        password: 'temporary-password',
        role: 'storeManager',
        scope: user.scope,
        sidebarAccess: ['dashboard'],
      })
    ).resolves.toEqual({
      success: true,
      user,
    });
  });

  test('does not disguise unexpected server failures', async () => {
    mockCreateRetailerUser.mockRejectedValue(
      new Error('Unexpected infrastructure failure')
    );

    await expect(
      createRetailerUserAction({
        idToken: 'valid-token',
        displayName: 'New User',
        email: 'new@example.com',
        password: 'temporary-password',
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
        sidebarAccess: ['dashboard'],
      })
    ).rejects.toThrow('Unexpected infrastructure failure');
  });
});
