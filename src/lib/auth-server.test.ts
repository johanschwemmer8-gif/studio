import { verifyAuth, getAuthorizedRetailerId } from './auth-server';
import { getDb, admin } from './firebase-admin';

jest.mock('./firebase-admin', () => ({
  admin: {
    auth: jest.fn(),
  },
  getDb: jest.fn(),
}));

const mockGetDb = getDb as jest.Mock;
const mockAdmin = admin as unknown as {
  auth: jest.Mock;
};

function validUserProfile(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    uid: 'user-123',
    retailerId: 'retailer-1',
    displayName: 'Test User',
    email: 'user@example.com',

    role: 'storeManager',

    scope: {
      level: 'store',
      networkId: 'network-1',
      brandId: 'brand-1',
      divisionId: 'division-1',
      regionId: 'region-1',
      areaId: 'area-1',
      storeId: 'store-1',
    },

    permissions: {
      dashboard: true,
      roi: true,
      visualsReporting: false,
      realTime: false,
      systemIntegration: false,
      retailMediaNetwork: false,
      manageUsers: true,
      manageOrganization: false,
      approve: false,
      export: false,
    },

    isActive: true,

    ...overrides,
  };
}

function mockFirestoreProfile(
  profile: Record<string, unknown> | null,
  tenant: Record<string, unknown> | null = {
    name: 'Test Retailer',
    type: 'production',
    lifecycleStatus: 'ACTIVE',
    createdAt: {},
  }
): void {
  mockGetDb.mockReturnValue({
    collection: jest.fn((collectionName: string) => ({
      doc: jest.fn(() => ({
        get: jest.fn(async () => {
          if (collectionName === 'users') {
            return {
              exists: profile !== null,
              data: () => profile ?? undefined,
            };
          }

          if (collectionName === 'tenants') {
            return {
              exists: tenant !== null,
              data: () => tenant ?? undefined,
            };
          }

          return {
            exists: false,
            data: () => undefined,
          };
        }),
      })),
    })),
  });
}

function mockVerifiedToken(
  tokenOverrides: Record<string, unknown> = {}
): void {
  mockAdmin.auth.mockReturnValue({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'user-123',
      ...tokenOverrides,
    }),
  });
}

describe('verifyAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fails closed when no token is supplied', async () => {
    const result = await verifyAuth();

    expect(result.uid).toBe('');
    expect(result.error).toBeDefined();

    if ('role' in result) {
      fail('Authentication failure must not contain a retailer role.');
    }
  });

  test('fails closed when Firebase token verification fails', async () => {
    mockAdmin.auth.mockReturnValue({
      verifyIdToken: jest.fn().mockRejectedValue({
        code: 'auth/invalid-id-token',
        message: 'Invalid token',
      }),
    });

    const result = await verifyAuth('invalid-token');

    expect(result.uid).toBe('');
    expect(result.error).toBe('Authentication failed.');

    if ('role' in result) {
      fail('Authentication failure must not contain a retailer role.');
    }
  });

  test('uses the authoritative Firestore profile rather than token claims', async () => {
    mockVerifiedToken({
      role: 'networkOwner',
      retailerId: 'retailer-attacker',
      scope: {
        level: 'network',
        networkId: 'attacker-network',
      },
    });

    mockFirestoreProfile(validUserProfile());

    const result = await verifyAuth('valid-token');

    expect(result).toMatchObject({
      uid: 'user-123',
      retailerId: 'retailer-1',
      role: 'storeManager',
      scope: {
        level: 'store',
        networkId: 'network-1',
        brandId: 'brand-1',
        divisionId: 'division-1',
        regionId: 'region-1',
        areaId: 'area-1',
        storeId: 'store-1',
      },
      isActive: true,
    });

    if ('error' in result) {
      throw new Error(result.error);
    }

    expect(result.permissions).toBeDefined();
  });

  test('returns authoritative sidebar access from the Firestore profile', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(
      validUserProfile({
        sidebarAccess: ['dashboard', 'products', 'qrManagement'],
      })
    );

    const result = await verifyAuth('valid-token');

    if ('error' in result) {
      throw new Error(result.error);
    }

    expect(result.sidebarAccess).toEqual([
      'dashboard',
      'products',
      'qrManagement',
    ]);
  });

  test('preserves missing sidebar access for a legacy authoritative profile', async () => {
    mockVerifiedToken();
    mockFirestoreProfile(validUserProfile());

    const result = await verifyAuth('valid-token');

    if ('error' in result) {
      throw new Error(result.error);
    }

    expect(result.sidebarAccess).toBeUndefined();
  });

  test('fails closed when sidebar access contains an unknown functional area', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(
      validUserProfile({
        sidebarAccess: ['dashboard', 'not-real'],
      })
    );

    const result = await verifyAuth('valid-token');

    expect(result).toEqual({
      uid: '',
      error:
        'INVALID_AUTHORIZATION_PROFILE: Authoritative user profile is invalid.',
    });
  });

  test('fails closed when sidebar access contains duplicate functional areas', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(
      validUserProfile({
        sidebarAccess: ['dashboard', 'dashboard'],
      })
    );

    const result = await verifyAuth('valid-token');

    expect(result).toEqual({
      uid: '',
      error:
        'INVALID_AUTHORIZATION_PROFILE: Authoritative user profile is invalid.',
    });
  });

  test('fails closed when the authoritative user profile does not exist', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(null);

    const result = await verifyAuth('valid-token');

    expect(result.uid).toBe('');
    expect(result.error).toBe(
      'IDENTITY_NOT_PROVISIONED: Authoritative user profile not found.'
    );
  });

  test('fails closed for an inactive user profile', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(
      validUserProfile({
        isActive: false,
      })
    );

    const result = await verifyAuth('valid-token');

    expect(result.uid).toBe('');
    expect(result.error).toBe(
      'ACCOUNT_INACTIVE: User account is inactive.'
    );
  });

  test('allows an ACTIVE retailer tenant', async () => {
    mockVerifiedToken();
    mockFirestoreProfile(validUserProfile(), {
      name: 'Test Retailer',
      type: 'production',
      lifecycleStatus: 'ACTIVE',
      createdAt: {},
    });

    const result = await verifyAuth('valid-token');

    expect('error' in result).toBe(false);
    expect(result.uid).toBe('user-123');
  });

  test('allows an OFFBOARDING retailer tenant during controlled handover', async () => {
    mockVerifiedToken();
    mockFirestoreProfile(validUserProfile(), {
      name: 'Test Retailer',
      type: 'production',
      lifecycleStatus: 'OFFBOARDING',
      createdAt: {},
    });

    const result = await verifyAuth('valid-token');

    expect('error' in result).toBe(false);
    expect(result.uid).toBe('user-123');
  });

  test('fails closed for a SUSPENDED retailer tenant', async () => {
    mockVerifiedToken();
    mockFirestoreProfile(validUserProfile(), {
      name: 'Test Retailer',
      type: 'production',
      lifecycleStatus: 'SUSPENDED',
      createdAt: {},
    });

    const result = await verifyAuth('valid-token');

    expect(result).toEqual({
      uid: '',
      error: 'TENANT_NOT_OPERATIONAL: Retailer tenant is not operational.',
    });
  });

  test('fails closed for a DECOMMISSIONED retailer tenant', async () => {
    mockVerifiedToken();
    mockFirestoreProfile(validUserProfile(), {
      name: 'Test Retailer',
      type: 'production',
      lifecycleStatus: 'DECOMMISSIONED',
      createdAt: {},
    });

    const result = await verifyAuth('valid-token');

    expect(result).toEqual({
      uid: '',
      error: 'TENANT_NOT_OPERATIONAL: Retailer tenant is not operational.',
    });
  });

  test('fails closed when the authoritative retailer tenant does not exist', async () => {
    mockVerifiedToken();
    mockFirestoreProfile(validUserProfile(), null);

    const result = await verifyAuth('valid-token');

    expect(result).toEqual({
      uid: '',
      error: 'TENANT_NOT_FOUND: Authoritative retailer tenant not found.',
    });
  });

  test('fails closed for missing or unrecognized tenant lifecycle', async () => {
    mockVerifiedToken();
    mockFirestoreProfile(validUserProfile(), {
      name: 'Test Retailer',
      type: 'production',
      createdAt: {},
    });

    const result = await verifyAuth('valid-token');

    expect(result).toEqual({
      uid: '',
      error: 'TENANT_NOT_OPERATIONAL: Retailer tenant is not operational.',
    });

    mockFirestoreProfile(validUserProfile(), {
      name: 'Test Retailer',
      type: 'production',
      lifecycleStatus: 'UNKNOWN_STATE',
      createdAt: {},
    });

    const unknownResult = await verifyAuth('valid-token');

    expect(unknownResult).toEqual({
      uid: '',
      error: 'TENANT_NOT_OPERATIONAL: Retailer tenant is not operational.',
    });
  });

  test('allows a legacy active tenant during compatibility migration', async () => {
    mockVerifiedToken();
    mockFirestoreProfile(validUserProfile(), {
      name: 'Legacy Retailer',
      type: 'production',
      status: 'active',
      createdAt: {},
    });

    const result = await verifyAuth('valid-token');

    expect('error' in result).toBe(false);
    expect(result.uid).toBe('user-123');
  });

  test('fails closed for an invalid role', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(
      validUserProfile({
        role: 'admin',
      })
    );

    const result = await verifyAuth('valid-token');

    expect(result.uid).toBe('');
    expect(result.error).toBe(
      'INVALID_AUTHORIZATION_PROFILE: Authoritative user profile is invalid.'
    );
  });

  test('fails closed for an invalid role-scope pairing', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(
      validUserProfile({
        role: 'storeManager',
        scope: {
          level: 'network',
          networkId: 'network-1',
        },
      })
    );

    const result = await verifyAuth('valid-token');

    expect(result.uid).toBe('');
    expect(result.error).toBe(
      'INVALID_AUTHORIZATION_PROFILE: Authoritative user profile is invalid.'
    );
  });

  test('fails closed when retailerId is missing', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(
      validUserProfile({
        retailerId: '',
      })
    );

    const result = await verifyAuth('valid-token');

    expect(result.uid).toBe('');
    expect(result.error).toBe(
      'INVALID_AUTHORIZATION_PROFILE: Authoritative user profile is invalid.'
    );
  });

  test('fails closed when the profile uid does not match the Firebase uid', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(
      validUserProfile({
        uid: 'different-user',
      })
    );

    const result = await verifyAuth('valid-token');

    expect(result.uid).toBe('');
    expect(result.error).toBe(
      'INVALID_AUTHORIZATION_PROFILE: Authoritative user profile is invalid.'
    );
  });

  test('fails closed when permissions are malformed', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(
      validUserProfile({
        permissions: {
          dashboard: true,
          roi: true,
        },
      })
    );

    const result = await verifyAuth('valid-token');

    expect(result.uid).toBe('');
    expect(result.error).toBe(
      'INVALID_AUTHORIZATION_PROFILE: Authoritative user profile is invalid.'
    );
  });

  test('does not trust a legacy admin role from Firebase claims', async () => {
    mockVerifiedToken({
      role: 'admin',
      retailerId: 'retailer-attacker',
    });

    mockFirestoreProfile(validUserProfile());

    const result = await verifyAuth('valid-token');

    expect(result).toMatchObject({
      uid: 'user-123',
      retailerId: 'retailer-1',
      role: 'storeManager',
    });
  });
});

describe('getAuthorizedRetailerId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns the authoritative retailerId for a valid retailer user', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(validUserProfile());

    await expect(
      getAuthorizedRetailerId('valid-token', 'retailer-1')
    ).resolves.toBe('retailer-1');
  });

  test('rejects a request for another retailer', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(validUserProfile());

    await expect(
      getAuthorizedRetailerId('valid-token', 'retailer-2')
    ).rejects.toThrow('ACCESS_DENIED: Tenant mismatch.');
  });

  test('does not provide a retailer-side admin bypass', async () => {
    mockVerifiedToken({
      role: 'admin',
      retailerId: 'retailer-attacker',
    });

    mockFirestoreProfile(validUserProfile());

    await expect(
      getAuthorizedRetailerId('valid-token', 'retailer-2')
    ).rejects.toThrow('ACCESS_DENIED: Tenant mismatch.');
  });

  test('rejects an unauthenticated request', async () => {
    await expect(
      getAuthorizedRetailerId(undefined, 'retailer-1')
    ).rejects.toThrow('Authentication required');
  });

  test('uses the authoritative retailer when requested retailer is unknown', async () => {
    mockVerifiedToken();

    mockFirestoreProfile(validUserProfile());

    await expect(
      getAuthorizedRetailerId('valid-token', 'unknown')
    ).resolves.toBe('retailer-1');
  });
});
