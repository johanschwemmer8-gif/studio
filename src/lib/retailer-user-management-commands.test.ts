import {
  createRetailerUser,
  listRetailerManagedUsers,
  reactivateRetailerUser,
  suspendRetailerUser,
  updateRetailerUserAuthorization,
} from './retailer-user-management-server';
import { verifyAuth } from './auth-server';
import { admin, getDb } from './firebase-admin';
import { getDefaultPermissions } from './user-profile';

jest.mock('./auth-server', () => ({
  verifyAuth: jest.fn(),
}));

jest.mock('./firebase-admin', () => ({
  admin: {
    auth: jest.fn(),
    firestore: {
      Timestamp: {
        now: jest.fn(),
      },
    },
  },
  getDb: jest.fn(),
}));

const mockVerifyAuth = verifyAuth as jest.Mock;
const mockGetDb = getDb as jest.Mock;
const mockAdmin = admin as unknown as {
  auth: jest.Mock;
  firestore: {
    Timestamp: {
      now: jest.Mock;
    };
  };
};

function actor() {
  return {
    uid: 'owner-1',
    retailerId: 'retailer-1',
    role: 'networkOwner' as const,
    scope: {
      level: 'network' as const,
      networkId: 'retailer-1',
    },
    permissions: getDefaultPermissions('networkOwner'),
    isActive: true,
  };
}

function storedStoreManager(overrides: Record<string, unknown> = {}) {
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

describe('authoritative retailer user commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAuth.mockResolvedValue(actor());
    mockAdmin.firestore.Timestamp.now.mockReturnValue({
      toDate: () => new Date('2026-10-08T00:00:00.000Z'),
    });
  });

  test('lists only manageable users from the authenticated retailer query', async () => {
    const where = jest.fn();
    const get = jest.fn();

    get.mockResolvedValue({
      docs: [
        {
          id: 'manager-1',
          data: () => storedStoreManager(),
        },
        {
          id: 'owner-2',
          data: () =>
            storedStoreManager({
              uid: 'owner-2',
              displayName: 'Other Owner',
              email: 'owner2@example.com',
              role: 'networkOwner',
              scope: {
                level: 'network',
                networkId: 'retailer-1',
              },
              permissions: getDefaultPermissions('networkOwner'),
            }),
        },
      ],
    });

    where.mockReturnValue({ get });

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name !== 'users') {
          throw new Error(`Unexpected collection ${name}`);
        }

        return { where };
      }),
    });

    const result = await listRetailerManagedUsers({
      idToken: 'valid-token',
    });

    expect(where).toHaveBeenCalledWith(
      'retailerId',
      '==',
      'retailer-1'
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      uid: 'manager-1',
      role: 'storeManager',
    });
  });

  test('does not accept retailerId as list authority', () => {
    expect(listRetailerManagedUsers.length).toBe(1);
  });

  test('creates a user only after retailer authority is established', async () => {
    const createUser = jest.fn().mockResolvedValue({
      uid: 'new-user-1',
    });
    const deleteUser = jest.fn();

    mockAdmin.auth.mockReturnValue({
      createUser,
      deleteUser,
    });

    const set = jest.fn().mockResolvedValue(undefined);
    const add = jest.fn().mockResolvedValue({ id: 'audit-1' });

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'users') {
          return {
            doc: jest.fn(() => ({ set })),
          };
        }

        if (name === 'auditLogs') {
          return { add };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    const result = await createRetailerUser({
      idToken: 'valid-token',
      displayName: 'New Store Manager',
      email: 'new-manager@example.com',
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
    });

    expect(createUser).toHaveBeenCalledWith({
      email: 'new-manager@example.com',
      displayName: 'New Store Manager',
      disabled: false,
    });
    expect(createUser.mock.calls[0][0]).not.toHaveProperty('password');

    expect(set).toHaveBeenCalledTimes(1);

    const persisted = set.mock.calls[0][0];

    expect(persisted.retailerId).toBe('retailer-1');
    expect(persisted.uid).toBe('new-user-1');
    expect(persisted.permissions).toEqual(
      getDefaultPermissions('storeManager')
    );
    expect(persisted).not.toHaveProperty('password');

    expect(add).toHaveBeenCalledTimes(1);
    expect(add.mock.calls[0][0]).not.toHaveProperty('password');

    expect(result.uid).toBe('new-user-1');
    expect(deleteUser).not.toHaveBeenCalled();
  });

  test('rejects unauthorized creation before Firebase Auth side effects', async () => {
    mockVerifyAuth.mockResolvedValue({
      ...actor(),
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
      permissions: {
        ...getDefaultPermissions('storeManager'),
        manageUsers: false,
      },
    });

    const createUser = jest.fn();

    mockAdmin.auth.mockReturnValue({
      createUser,
      deleteUser: jest.fn(),
    });

    await expect(
      createRetailerUser({
        idToken: 'valid-token',
        displayName: 'Blocked User',
        email: 'blocked@example.com',
        role: 'storeUser',
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
    ).rejects.toThrow('USER_MANAGEMENT_FORBIDDEN');

    expect(createUser).not.toHaveBeenCalled();
  });

  test('rolls back Firebase Auth identity if profile persistence fails', async () => {
    const createUser = jest.fn().mockResolvedValue({
      uid: 'new-user-rollback',
    });
    const deleteUser = jest.fn().mockResolvedValue(undefined);

    mockAdmin.auth.mockReturnValue({
      createUser,
      deleteUser,
    });

    const set = jest
      .fn()
      .mockRejectedValue(new Error('Firestore write failed'));

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'users') {
          return {
            doc: jest.fn(() => ({ set })),
          };
        }

        if (name === 'auditLogs') {
          return {
            add: jest.fn(),
          };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    await expect(
      createRetailerUser({
        idToken: 'valid-token',
        displayName: 'Rollback User',
        email: 'rollback@example.com',
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
    ).rejects.toThrow('Firestore write failed');

    expect(deleteUser).toHaveBeenCalledWith(
      'new-user-rollback'
    );
  });

  test('does not write an audit event when profile persistence fails', async () => {
    const createUser = jest.fn().mockResolvedValue({
      uid: 'new-user-no-audit',
    });

    mockAdmin.auth.mockReturnValue({
      createUser,
      deleteUser: jest.fn().mockResolvedValue(undefined),
    });

    const add = jest.fn();

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'users') {
          return {
            doc: jest.fn(() => ({
              set: jest
                .fn()
                .mockRejectedValue(
                  new Error('Profile persistence failed')
                ),
            })),
          };
        }

        if (name === 'auditLogs') {
          return { add };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    await expect(
      createRetailerUser({
        idToken: 'valid-token',
        displayName: 'No Audit User',
        email: 'no-audit@example.com',
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
    ).rejects.toThrow('Profile persistence failed');

    expect(add).not.toHaveBeenCalled();
  });

  test('preserves the identity when audit persistence fails after profile creation', async () => {
    const createUser = jest.fn().mockResolvedValue({
      uid: 'new-user-audit-failure',
    });
    const deleteUser = jest.fn().mockResolvedValue(undefined);

    mockAdmin.auth.mockReturnValue({
      createUser,
      deleteUser,
    });

    const set = jest.fn().mockResolvedValue(undefined);
    const add = jest
      .fn()
      .mockRejectedValue(new Error('Audit persistence failed'));

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'users') {
          return {
            doc: jest.fn(() => ({ set })),
          };
        }

        if (name === 'auditLogs') {
          return { add };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    const result = await createRetailerUser({
      idToken: 'valid-token',
      displayName: 'Audit Failure User',
      email: 'audit-failure@example.com',
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

    expect(set).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledTimes(1);
    expect(deleteUser).not.toHaveBeenCalled();
    expect(result.uid).toBe('new-user-audit-failure');
  });

  test('updates only after authorizing both current and proposed target', async () => {
    const get = jest.fn().mockResolvedValue({
      exists: true,
      id: 'manager-1',
      data: () => storedStoreManager(),
    });

    const update = jest.fn().mockResolvedValue(undefined);
    const add = jest.fn().mockResolvedValue({ id: 'audit-update' });

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'users') {
          return {
            doc: jest.fn(() => ({
              get,
              update,
            })),
          };
        }

        if (name === 'auditLogs') {
          return { add };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    const result = await updateRetailerUserAuthorization({
      idToken: 'valid-token',
      targetUid: 'manager-1',
      role: 'storeUser',
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

    expect(update).toHaveBeenCalledTimes(1);

    const patch = update.mock.calls[0][0];

    expect(patch.role).toBe('storeUser');
    expect(patch.permissions).toEqual(
      getDefaultPermissions('storeUser')
    );
    expect(patch.sidebarAccess).toEqual(['dashboard']);

    expect(add).toHaveBeenCalledTimes(1);
    expect(result.role).toBe('storeUser');
  });

  test('rejects promotion of a manageable target beyond actor authority', async () => {
    mockVerifyAuth.mockResolvedValue({
      ...actor(),
      role: 'networkAdmin',
      permissions: getDefaultPermissions('networkAdmin'),
    });

    const get = jest.fn().mockResolvedValue({
      exists: true,
      id: 'manager-1',
      data: () => storedStoreManager(),
    });

    const update = jest.fn();

    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get,
          update,
        })),
      })),
    });

    await expect(
      updateRetailerUserAuthorization({
        idToken: 'valid-token',
        targetUid: 'manager-1',
        role: 'networkOwner',
        scope: {
          level: 'network',
          networkId: 'retailer-1',
        },
        sidebarAccess: ['dashboard'],
      })
    ).rejects.toThrow(
      'Target role has equal or higher authority.'
    );

    expect(update).not.toHaveBeenCalled();
  });

  test('rejects update when existing target is outside actor authority', async () => {
    const get = jest.fn().mockResolvedValue({
      exists: true,
      id: 'foreign-manager',
      data: () =>
        storedStoreManager({
          retailerId: 'retailer-2',
        }),
    });

    const update = jest.fn();

    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get,
          update,
        })),
      })),
    });

    await expect(
      updateRetailerUserAuthorization({
        idToken: 'valid-token',
        targetUid: 'foreign-manager',
        role: 'storeUser',
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
    ).rejects.toThrow(
      'Target user belongs to a different retailer.'
    );

    expect(update).not.toHaveBeenCalled();
  });

  test('suspends an authorized lower-authority user without deleting identity', async () => {
    const getUser = jest.fn().mockResolvedValue({
      uid: 'manager-1',
      disabled: false,
    });
    const updateUser = jest.fn().mockResolvedValue({
      uid: 'manager-1',
    });

    mockAdmin.auth.mockReturnValue({
      getUser,
      updateUser,
    });

    const get = jest.fn().mockResolvedValue({
      exists: true,
      id: 'manager-1',
      data: () => storedStoreManager(),
    });

    const update = jest.fn().mockResolvedValue(undefined);
    const add = jest.fn().mockResolvedValue({ id: 'audit-suspend' });

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'users') {
          return {
            doc: jest.fn(() => ({
              get,
              update,
            })),
          };
        }

        if (name === 'auditLogs') {
          return { add };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    const result = await suspendRetailerUser({
      idToken: 'valid-token',
      targetUid: 'manager-1',
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
        updatedBy: 'owner-1',
      })
    );

    expect(result.isActive).toBe(false);
    expect(add.mock.calls[0][0].type).toBe(
      'RETAILER_USER_SUSPENDED'
    );
  });

  test('reactivates an authorized inactive user', async () => {
    const getUser = jest.fn().mockResolvedValue({
      uid: 'manager-1',
      disabled: true,
    });
    const updateUser = jest.fn().mockResolvedValue({
      uid: 'manager-1',
    });

    mockAdmin.auth.mockReturnValue({
      getUser,
      updateUser,
    });

    const get = jest.fn().mockResolvedValue({
      exists: true,
      id: 'manager-1',
      data: () =>
        storedStoreManager({
          isActive: false,
        }),
    });

    const update = jest.fn().mockResolvedValue(undefined);
    const add = jest.fn().mockResolvedValue({ id: 'audit-reactivate' });

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'users') {
          return {
            doc: jest.fn(() => ({
              get,
              update,
            })),
          };
        }

        if (name === 'auditLogs') {
          return { add };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    const result = await reactivateRetailerUser({
      idToken: 'valid-token',
      targetUid: 'manager-1',
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
        updatedBy: 'owner-1',
      })
    );

    expect(result.isActive).toBe(true);
    expect(add.mock.calls[0][0].type).toBe(
      'RETAILER_USER_REACTIVATED'
    );
  });

  test('restores previous Firebase Auth disabled state when lifecycle profile persistence fails', async () => {
    const getUser = jest.fn().mockResolvedValue({
      uid: 'manager-1',
      disabled: false,
    });
    const updateUser = jest.fn().mockResolvedValue({
      uid: 'manager-1',
    });

    mockAdmin.auth.mockReturnValue({
      getUser,
      updateUser,
    });

    const update = jest
      .fn()
      .mockRejectedValue(new Error('Profile update failed'));

    const add = jest.fn();

    mockGetDb.mockReturnValue({
      collection: jest.fn((name: string) => {
        if (name === 'users') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                exists: true,
                id: 'manager-1',
                data: () => storedStoreManager(),
              }),
              update,
            })),
          };
        }

        if (name === 'auditLogs') {
          return { add };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    });

    await expect(
      suspendRetailerUser({
        idToken: 'valid-token',
        targetUid: 'manager-1',
      })
    ).rejects.toThrow('Profile update failed');

    expect(getUser).toHaveBeenCalledWith('manager-1');

    expect(updateUser).toHaveBeenNthCalledWith(
      1,
      'manager-1',
      { disabled: true }
    );

    expect(updateUser).toHaveBeenNthCalledWith(
      2,
      'manager-1',
      { disabled: false }
    );

    expect(add).not.toHaveBeenCalled();
  });

  test('rejects suspend of equal-authority user', async () => {
    const get = jest.fn().mockResolvedValue({
      exists: true,
      id: 'owner-2',
      data: () =>
        storedStoreManager({
          uid: 'owner-2',
          displayName: 'Other Owner',
          email: 'owner2@example.com',
          role: 'networkOwner',
          scope: {
            level: 'network',
            networkId: 'retailer-1',
          },
          permissions: getDefaultPermissions('networkOwner'),
        }),
    });

    const update = jest.fn();

    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get,
          update,
        })),
      })),
    });

    await expect(
      suspendRetailerUser({
        idToken: 'valid-token',
        targetUid: 'owner-2',
      })
    ).rejects.toThrow(
      'Target role has equal or higher authority.'
    );

    expect(update).not.toHaveBeenCalled();
  });

  test('rejects missing target user', async () => {
    const get = jest.fn().mockResolvedValue({
      exists: false,
      id: 'missing-user',
      data: () => undefined,
    });

    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({ get })),
      })),
    });

    await expect(
      suspendRetailerUser({
        idToken: 'valid-token',
        targetUid: 'missing-user',
      })
    ).rejects.toThrow(
      'USER_MANAGEMENT_NOT_FOUND'
    );
  });

  test('rejects malformed authoritative stored permissions', async () => {
    const get = jest.fn().mockResolvedValue({
      exists: true,
      id: 'manager-invalid',
      data: () =>
        storedStoreManager({
          permissions: {
            dashboard: true,
          },
        }),
    });

    const update = jest.fn();

    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get,
          update,
        })),
      })),
    });

    await expect(
      suspendRetailerUser({
        idToken: 'valid-token',
        targetUid: 'manager-invalid',
      })
    ).rejects.toThrow(
      'USER_MANAGEMENT_INVALID: Target authorization profile is invalid.'
    );

    expect(update).not.toHaveBeenCalled();
  });
});
