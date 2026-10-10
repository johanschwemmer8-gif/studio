import { updateRetailerLifecycle } from './update-retailer-lifecycle';
import { verifyPlatformOperator } from '@/lib/auth-server';
import { getDb, admin } from '@/lib/firebase-admin';

jest.mock('@/lib/auth-server', () => ({
  verifyPlatformOperator: jest.fn(),
}));

jest.mock('@/lib/firebase-admin', () => ({
  getDb: jest.fn(),
  admin: {
    firestore: {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
      },
    },
  },
}));

const mockVerifyPlatformOperator = verifyPlatformOperator as jest.Mock;
const mockGetDb = getDb as jest.Mock;

type TenantData = Record<string, unknown>;

function mockLifecycleDb(
  tenant: TenantData | null,
  options: { auditFails?: boolean } = {}
) {
  const update = jest.fn();
  const auditAdd = options.auditFails
    ? jest.fn().mockRejectedValue(new Error('audit unavailable'))
    : jest.fn().mockResolvedValue(undefined);

  const tenantRef = { id: 'retailer-1' };

  const db = {
    collection: jest.fn((name: string) => {
      if (name === 'tenants') {
        return {
          doc: jest.fn(() => tenantRef),
        };
      }

      if (name === 'auditLogs') {
        return {
          add: auditAdd,
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    }),

    runTransaction: jest.fn(async (callback: any) => {
      const transaction = {
        get: jest.fn(async () => ({
          exists: tenant !== null,
          data: () => tenant ?? undefined,
        })),
        update,
      };

      return callback(transaction);
    }),
  };

  mockGetDb.mockReturnValue(db);

  return {
    db,
    update,
    auditAdd,
  };
}

describe('updateRetailerLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyPlatformOperator.mockResolvedValue({
      uid: 'operator-1',
      email: 'operator@example.com',
    });
  });

  test('requires platform operator authorization', async () => {
    mockVerifyPlatformOperator.mockRejectedValue(
      new Error('PLATFORM_ACCESS_DENIED')
    );

    const result = await updateRetailerLifecycle({
      idToken: 'token',
      retailerId: 'retailer-1',
      nextStatus: 'OFFBOARDING',
    });

    expect(result.success).toBe(false);
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  test('transitions ACTIVE to OFFBOARDING and records metadata and audit', async () => {
    const { update, auditAdd } = mockLifecycleDb({
      lifecycleStatus: 'ACTIVE',
      status: 'active',
    });

    const result = await updateRetailerLifecycle({
      idToken: 'token',
      retailerId: 'retailer-1',
      nextStatus: 'OFFBOARDING',
    });

    expect(result).toEqual({
      success: true,
      message: 'Retailer lifecycle changed from ACTIVE to OFFBOARDING.',
      lifecycleStatus: 'OFFBOARDING',
    });

    expect(update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        lifecycleStatus: 'OFFBOARDING',
        updatedBy: 'operator-1',
        offboardingStartedBy: 'operator-1',
      })
    );

    expect(auditAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'RETAILER_LIFECYCLE_TRANSITION',
        targetRetailerId: 'retailer-1',
        previousLifecycleStatus: 'ACTIVE',
        lifecycleStatus: 'OFFBOARDING',
        performedByUid: 'operator-1',
        result: 'success',
      })
    );
  });

  test('transitions OFFBOARDING to SUSPENDED', async () => {
    const { update } = mockLifecycleDb({
      lifecycleStatus: 'OFFBOARDING',
    });

    const result = await updateRetailerLifecycle({
      idToken: 'token',
      retailerId: 'retailer-1',
      nextStatus: 'SUSPENDED',
    });

    expect(result.lifecycleStatus).toBe('SUSPENDED');

    expect(update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        lifecycleStatus: 'SUSPENDED',
        suspendedBy: 'operator-1',
      })
    );
  });

  test('transitions SUSPENDED to DECOMMISSIONED', async () => {
    const { update } = mockLifecycleDb({
      lifecycleStatus: 'SUSPENDED',
    });

    const result = await updateRetailerLifecycle({
      idToken: 'token',
      retailerId: 'retailer-1',
      nextStatus: 'DECOMMISSIONED',
    });

    expect(result.lifecycleStatus).toBe('DECOMMISSIONED');

    expect(update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        lifecycleStatus: 'DECOMMISSIONED',
        decommissionedBy: 'operator-1',
      })
    );
  });

  test('rejects skipped lifecycle transitions', async () => {
    const { update, auditAdd } = mockLifecycleDb({
      lifecycleStatus: 'ACTIVE',
    });

    const result = await updateRetailerLifecycle({
      idToken: 'token',
      retailerId: 'retailer-1',
      nextStatus: 'SUSPENDED',
    });

    expect(result).toEqual({
      success: false,
      message: 'The requested retailer lifecycle transition is not permitted.',
    });

    expect(update).not.toHaveBeenCalled();
    expect(auditAdd).not.toHaveBeenCalled();
  });

  test('rejects transitions from DECOMMISSIONED', async () => {
    const { update } = mockLifecycleDb({
      lifecycleStatus: 'DECOMMISSIONED',
    });

    const result = await updateRetailerLifecycle({
      idToken: 'token',
      retailerId: 'retailer-1',
      nextStatus: 'ACTIVE',
    });

    expect(result.success).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  test('fails closed when the tenant does not exist', async () => {
    const { update } = mockLifecycleDb(null);

    const result = await updateRetailerLifecycle({
      idToken: 'token',
      retailerId: 'retailer-1',
      nextStatus: 'OFFBOARDING',
    });

    expect(result).toEqual({
      success: false,
      message: 'Retailer tenant not found.',
    });

    expect(update).not.toHaveBeenCalled();
  });

  test('does not roll back a successful lifecycle transition when audit persistence fails', async () => {
    const { update } = mockLifecycleDb(
      { lifecycleStatus: 'ACTIVE' },
      { auditFails: true }
    );

    const result = await updateRetailerLifecycle({
      idToken: 'token',
      retailerId: 'retailer-1',
      nextStatus: 'OFFBOARDING',
    });

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalled();
  });
});
