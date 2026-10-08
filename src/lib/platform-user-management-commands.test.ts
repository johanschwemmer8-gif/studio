const mockVerifyPlatformOperator = jest.fn();
const mockGetDb = jest.fn();
const mockCreateUser = jest.fn();
const mockDeleteUser = jest.fn();
const mockServerTimestamp = jest.fn(() => 'SERVER_TIMESTAMP');

jest.mock('./auth-server', () => ({
  verifyPlatformOperator: (...args: unknown[]) =>
    mockVerifyPlatformOperator(...args),
}));

jest.mock('./firebase-admin', () => ({
  getDb: () => mockGetDb(),
  admin: {
    auth: () => ({
      createUser: (...args: unknown[]) =>
        mockCreateUser(...args),
      deleteUser: (...args: unknown[]) =>
        mockDeleteUser(...args),
    }),
    firestore: {
      FieldValue: {
        serverTimestamp: () => mockServerTimestamp(),
      },
    },
  },
}));

import {
  createPlatformRetailerUser,
  listPlatformRetailerUsers,
  reactivatePlatformRetailerUser,
  suspendPlatformRetailerUser,
  updatePlatformRetailerUserAuthorization,
} from './platform-user-management-server';
import { getDefaultPermissions } from './user-profile';

function activeTenant() {
  return {
    exists: true,
    data: () => ({
      name: 'Retailer One',
      lifecycleStatus: 'ACTIVE',
      status: 'active',
    }),
  };
}

describe('platform retailer user management commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyPlatformOperator.mockResolvedValue({
      uid: 'operator-1',
      email: 'operator@example.com',
    });
  });

  test('lists only users for explicitly selected retailer', async () => {
    const usersGet = jest.fn().mockResolvedValue({
      docs: [
        {
          id: 'user-1',
          data: () => ({
            uid: 'user-1',
            displayName: 'Network Owner',
            email: 'owner@example.com',
            retailerId: 'retailer-1',
            role: 'networkOwner',
            scope: {
              level: 'network',
              networkId: 'retailer-1',
            },
            permissions:
              getDefaultPermissions('networkOwner'),
            sidebarAccess: [
              'dashboard',
              'organization',
            ],
            isActive: true,
          }),
        },
      ],
    });

    const where = jest.fn(
      (field: string, operator: string, value: string) => {
        expect(field).toBe('retailerId');
        expect(operator).toBe('==');
        expect(value).toBe('retailer-1');
        return { get: usersGet };
      }
    );

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'tenants') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(activeTenant()),
            })),
          };
        }

        if (name === 'users') {
          return { where };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    const users = await listPlatformRetailerUsers(
      'platform-token',
      'retailer-1'
    );

    expect(users).toHaveLength(1);
    expect(users[0].uid).toBe('user-1');
    expect(users[0].retailerId).toBe('retailer-1');
    expect(where).toHaveBeenCalledTimes(1);
  });

  test('creates Auth identity and canonical profile', async () => {
    const userSet = jest.fn().mockResolvedValue(undefined);
    const auditAdd = jest.fn().mockResolvedValue({
      id: 'audit-1',
    });

    mockCreateUser.mockResolvedValue({
      uid: 'new-user-1',
    });

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'tenants') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(activeTenant()),
            })),
          };
        }

        if (name === 'users') {
          return {
            doc: jest.fn(() => ({
              set: userSet,
            })),
          };
        }

        if (name === 'auditLogs') {
          return { add: auditAdd };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    const result = await createPlatformRetailerUser({
      idToken: 'platform-token',
      retailerId: 'retailer-1',
      displayName: 'Store Manager',
      email: 'manager@example.com',
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
      sidebarAccess: [
        'dashboard',
        'products',
        'qrManagement',
      ],
    });

    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'manager@example.com',
      password: 'temporary-password',
      displayName: 'Store Manager',
      emailVerified: false,
    });

    const saved = userSet.mock.calls[0][0];

    expect(saved.uid).toBe('new-user-1');
    expect(saved.retailerId).toBe('retailer-1');
    expect(saved.role).toBe('storeManager');
    expect(saved.permissions).toEqual(
      getDefaultPermissions('storeManager')
    );
    expect(saved.sidebarAccess).toEqual([
      'dashboard',
      'products',
      'qrManagement',
    ]);
    expect(saved.isActive).toBe(true);
    expect(saved.provisionedBy).toBe('operator-1');
    expect(saved.updatedBy).toBe('operator-1');

    expect(auditAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PLATFORM_RETAILER_USER_CREATED',
        actorUid: 'operator-1',
        retailerId: 'retailer-1',
        targetUid: 'new-user-1',
      })
    );

    expect(result).toEqual(
      expect.objectContaining({
        uid: 'new-user-1',
        retailerId: 'retailer-1',
        isActive: true,
      })
    );
  });

  test('rejects suspended retailer before Auth creation', async () => {
    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'tenants') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  lifecycleStatus: 'SUSPENDED',
                  status: 'active',
                }),
              }),
            })),
          };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    await expect(
      createPlatformRetailerUser({
        idToken: 'platform-token',
        retailerId: 'retailer-1',
        displayName: 'Blocked User',
        email: 'blocked@example.com',
        password: 'temporary-password',
        role: 'networkOwner',
        scope: {
          level: 'network',
          networkId: 'retailer-1',
        },
        sidebarAccess: ['dashboard'],
      })
    ).rejects.toThrow(
      'PLATFORM_USER_MANAGEMENT_FORBIDDEN'
    );

    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  test('rejects cross-retailer scope before Auth creation', async () => {
    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'tenants') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(activeTenant()),
            })),
          };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    await expect(
      createPlatformRetailerUser({
        idToken: 'platform-token',
        retailerId: 'retailer-1',
        displayName: 'Foreign User',
        email: 'foreign@example.com',
        password: 'temporary-password',
        role: 'networkOwner',
        scope: {
          level: 'network',
          networkId: 'retailer-2',
        },
        sidebarAccess: ['dashboard'],
      })
    ).rejects.toThrow(
      'PLATFORM_USER_MANAGEMENT_INVALID'
    );

    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  test('rolls back Auth when profile persistence fails', async () => {
    mockCreateUser.mockResolvedValue({
      uid: 'orphan-user',
    });

    mockDeleteUser.mockResolvedValue(undefined);

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'tenants') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(activeTenant()),
            })),
          };
        }

        if (name === 'users') {
          return {
            doc: jest.fn(() => ({
              set: jest.fn().mockRejectedValue(
                new Error('profile persistence failed')
              ),
            })),
          };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    await expect(
      createPlatformRetailerUser({
        idToken: 'platform-token',
        retailerId: 'retailer-1',
        displayName: 'Rollback User',
        email: 'rollback@example.com',
        password: 'temporary-password',
        role: 'networkOwner',
        scope: {
          level: 'network',
          networkId: 'retailer-1',
        },
        sidebarAccess: ['dashboard'],
      })
    ).rejects.toThrow(
      'PLATFORM_USER_MANAGEMENT_CREATE_FAILED'
    );

    expect(mockDeleteUser).toHaveBeenCalledWith(
      'orphan-user'
    );
  });

  test('audit failure does not falsely fail completed creation', async () => {
    mockCreateUser.mockResolvedValue({
      uid: 'created-user',
    });

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'tenants') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(activeTenant()),
            })),
          };
        }

        if (name === 'users') {
          return {
            doc: jest.fn(() => ({
              set: jest.fn().mockResolvedValue(undefined),
            })),
          };
        }

        if (name === 'auditLogs') {
          return {
            add: jest.fn().mockRejectedValue(
              new Error('audit unavailable')
            ),
          };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    await expect(
      createPlatformRetailerUser({
        idToken: 'platform-token',
        retailerId: 'retailer-1',
        displayName: 'Created User',
        email: 'created@example.com',
        password: 'temporary-password',
        role: 'networkOwner',
        scope: {
          level: 'network',
          networkId: 'retailer-1',
        },
        sidebarAccess: ['dashboard'],
      })
    ).resolves.toEqual(
      expect.objectContaining({
        uid: 'created-user',
        retailerId: 'retailer-1',
        isActive: true,
      })
    );

    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});


describe('R3.3.3C platform retailer user mutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyPlatformOperator.mockResolvedValue({
      uid: 'operator-1',
      email: 'operator@example.com',
    });
  });

  function canonicalTarget(overrides: Record<string, unknown> = {}) {
    return {
      uid: 'target-1',
      displayName: 'Target User',
      email: 'target@example.com',
      retailerId: 'retailer-1',
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
      permissions:
        getDefaultPermissions('storeManager'),
      sidebarAccess: [
        'dashboard',
        'products',
      ],
      isActive: true,
      ...overrides,
    };
  }

  function mutationDb(
    target: Record<string, unknown>,
    userUpdate: jest.Mock,
    auditAdd: jest.Mock
  ) {
    return {
      collection: jest.fn((name: string) => {
        if (name === 'tenants') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(activeTenant()),
            })),
          };
        }

        if (name === 'users') {
          return {
            doc: jest.fn((uid: string) => ({
              get: jest.fn().mockResolvedValue({
                exists: true,
                id: uid,
                data: () => target,
              }),
              update: userUpdate,
            })),
          };
        }

        if (name === 'auditLogs') {
          return { add: auditAdd };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    };
  }

  test('updates canonical authorization within selected retailer', async () => {
    const userUpdate = jest.fn().mockResolvedValue(undefined);
    const auditAdd = jest.fn().mockResolvedValue({
      id: 'audit-update',
    });

    mockGetDb.mockReturnValue(
      mutationDb(
        canonicalTarget(),
        userUpdate,
        auditAdd
      )
    );

    const result =
      await updatePlatformRetailerUserAuthorization({
        idToken: 'platform-token',
        retailerId: 'retailer-1',
        targetUid: 'target-1',
        role: 'analyst',
        scope: {
          level: 'network',
          networkId: 'retailer-1',
        },
        sidebarAccess: [
          'dashboard',
          'visualsReporting',
        ],
      });

    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'analyst',
        permissions:
          getDefaultPermissions('analyst'),
        sidebarAccess: [
          'dashboard',
          'visualsReporting',
        ],
        updatedBy: 'operator-1',
      })
    );

    expect(auditAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type:
          'PLATFORM_RETAILER_USER_AUTHORIZATION_UPDATED',
        actorUid: 'operator-1',
        retailerId: 'retailer-1',
        targetUid: 'target-1',
        previous: expect.objectContaining({
          role: 'storeManager',
        }),
        current: expect.objectContaining({
          role: 'analyst',
        }),
      })
    );

    expect(result.role).toBe('analyst');
    expect(result.isActive).toBe(true);
  });

  test('rejects target belonging to another retailer', async () => {
    const userUpdate = jest.fn();
    const auditAdd = jest.fn();

    mockGetDb.mockReturnValue(
      mutationDb(
        canonicalTarget({
          retailerId: 'retailer-2',
          scope: {
            level: 'network',
            networkId: 'retailer-2',
          },
          role: 'networkOwner',
          permissions:
            getDefaultPermissions('networkOwner'),
        }),
        userUpdate,
        auditAdd
      )
    );

    await expect(
      updatePlatformRetailerUserAuthorization({
        idToken: 'platform-token',
        retailerId: 'retailer-1',
        targetUid: 'target-1',
        role: 'networkOwner',
        scope: {
          level: 'network',
          networkId: 'retailer-1',
        },
        sidebarAccess: ['dashboard'],
      })
    ).rejects.toThrow(
      'PLATFORM_USER_MANAGEMENT_FORBIDDEN'
    );

    expect(userUpdate).not.toHaveBeenCalled();
    expect(auditAdd).not.toHaveBeenCalled();
  });

  test('rejects proposed cross-retailer scope', async () => {
    const userUpdate = jest.fn();
    const auditAdd = jest.fn();

    mockGetDb.mockReturnValue(
      mutationDb(
        canonicalTarget(),
        userUpdate,
        auditAdd
      )
    );

    await expect(
      updatePlatformRetailerUserAuthorization({
        idToken: 'platform-token',
        retailerId: 'retailer-1',
        targetUid: 'target-1',
        role: 'networkOwner',
        scope: {
          level: 'network',
          networkId: 'retailer-2',
        },
        sidebarAccess: ['dashboard'],
      })
    ).rejects.toThrow(
      'PLATFORM_USER_MANAGEMENT_INVALID'
    );

    expect(userUpdate).not.toHaveBeenCalled();
    expect(auditAdd).not.toHaveBeenCalled();
  });

  test('suspends user without deleting Firebase Auth identity', async () => {
    const userUpdate = jest.fn().mockResolvedValue(undefined);
    const auditAdd = jest.fn().mockResolvedValue({
      id: 'audit-suspend',
    });

    mockGetDb.mockReturnValue(
      mutationDb(
        canonicalTarget(),
        userUpdate,
        auditAdd
      )
    );

    const result = await suspendPlatformRetailerUser({
      idToken: 'platform-token',
      retailerId: 'retailer-1',
      targetUid: 'target-1',
    });

    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
        updatedBy: 'operator-1',
      })
    );

    expect(mockDeleteUser).not.toHaveBeenCalled();

    expect(auditAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PLATFORM_RETAILER_USER_SUSPENDED',
        previousIsActive: true,
        currentIsActive: false,
      })
    );

    expect(result.isActive).toBe(false);
  });

  test('reactivates user while preserving authorization', async () => {
    const userUpdate = jest.fn().mockResolvedValue(undefined);
    const auditAdd = jest.fn().mockResolvedValue({
      id: 'audit-reactivate',
    });

    mockGetDb.mockReturnValue(
      mutationDb(
        canonicalTarget({
          isActive: false,
        }),
        userUpdate,
        auditAdd
      )
    );

    const result =
      await reactivatePlatformRetailerUser({
        idToken: 'platform-token',
        retailerId: 'retailer-1',
        targetUid: 'target-1',
      });

    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
        updatedBy: 'operator-1',
      })
    );

    expect(auditAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type:
          'PLATFORM_RETAILER_USER_REACTIVATED',
        previousIsActive: false,
        currentIsActive: true,
      })
    );

    expect(result.role).toBe('storeManager');
    expect(result.scope).toEqual(
      canonicalTarget().scope
    );
    expect(result.sidebarAccess).toEqual([
      'dashboard',
      'products',
    ]);
    expect(result.isActive).toBe(true);
  });

  test('audit failure does not falsely fail completed authorization update', async () => {
    const userUpdate = jest.fn().mockResolvedValue(undefined);
    const auditAdd = jest.fn().mockRejectedValue(
      new Error('audit unavailable')
    );

    mockGetDb.mockReturnValue(
      mutationDb(
        canonicalTarget(),
        userUpdate,
        auditAdd
      )
    );

    await expect(
      updatePlatformRetailerUserAuthorization({
        idToken: 'platform-token',
        retailerId: 'retailer-1',
        targetUid: 'target-1',
        role: 'analyst',
        scope: {
          level: 'network',
          networkId: 'retailer-1',
        },
        sidebarAccess: ['dashboard'],
      })
    ).resolves.toEqual(
      expect.objectContaining({
        uid: 'target-1',
        role: 'analyst',
      })
    );

    expect(userUpdate).toHaveBeenCalledTimes(1);
  });
});
