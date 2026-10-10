import { updateRetailerOffboarding } from './update-retailer-offboarding';
import { verifyPlatformOperator } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';

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

function mockOffboardingDb(tenant: Record<string, unknown> | null) {
  const update = jest.fn();
  const auditAdd = jest.fn().mockResolvedValue(undefined);
  const tenantRef = { id: 'retailer-1' };

  const db = {
    collection: jest.fn((name: string) => {
      if (name === 'tenants') {
        return { doc: jest.fn(() => tenantRef) };
      }

      if (name === 'auditLogs') {
        return { add: auditAdd };
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

  return { update, auditAdd };
}

describe('updateRetailerOffboarding', () => {
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

    const result = await updateRetailerOffboarding({
      idToken: 'token',
      retailerId: 'retailer-1',
      checkpoint: 'EXPORT_PREPARATION',
    });

    expect(result.success).toBe(false);
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  test('records export preparation during OFFBOARDING', async () => {
    const { update, auditAdd } = mockOffboardingDb({
      lifecycleStatus: 'OFFBOARDING',
    });

    const result = await updateRetailerOffboarding({
      idToken: 'token',
      retailerId: 'retailer-1',
      checkpoint: 'EXPORT_PREPARATION',
    });

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'offboarding.exportPreparation': expect.objectContaining({
          completed: true,
          completedBy: 'operator-1',
        }),
      })
    );
    expect(auditAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'RETAILER_OFFBOARDING_CHECKPOINT',
        checkpoint: 'EXPORT_PREPARATION',
      })
    );
  });

  test('records handover during OFFBOARDING', async () => {
    const { update } = mockOffboardingDb({
      lifecycleStatus: 'OFFBOARDING',
    });

    const result = await updateRetailerOffboarding({
      idToken: 'token',
      retailerId: 'retailer-1',
      checkpoint: 'HANDOVER',
    });

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'offboarding.handover': expect.objectContaining({
          completed: true,
          completedBy: 'operator-1',
        }),
      })
    );
  });

  test('records retention decision only while SUSPENDED', async () => {
    const { update } = mockOffboardingDb({
      lifecycleStatus: 'SUSPENDED',
    });

    const result = await updateRetailerOffboarding({
      idToken: 'token',
      retailerId: 'retailer-1',
      checkpoint: 'RETENTION_DECISION',
      decision: 'RETAIN',
    });

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'offboarding.retentionDecision': expect.objectContaining({
          decision: 'RETAIN',
          recordedBy: 'operator-1',
        }),
      })
    );
  });

  test('rejects operational checkpoints outside OFFBOARDING', async () => {
    const { update } = mockOffboardingDb({
      lifecycleStatus: 'ACTIVE',
    });

    const result = await updateRetailerOffboarding({
      idToken: 'token',
      retailerId: 'retailer-1',
      checkpoint: 'HANDOVER',
    });

    expect(result.success).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  test('rejects retention decision before suspension', async () => {
    const { update } = mockOffboardingDb({
      lifecycleStatus: 'OFFBOARDING',
    });

    const result = await updateRetailerOffboarding({
      idToken: 'token',
      retailerId: 'retailer-1',
      checkpoint: 'RETENTION_DECISION',
      decision: 'DELETE_AFTER_RETENTION',
    });

    expect(result.success).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  test('fails closed when retailer tenant is missing', async () => {
    const { update } = mockOffboardingDb(null);

    const result = await updateRetailerOffboarding({
      idToken: 'token',
      retailerId: 'retailer-1',
      checkpoint: 'EXPORT_PREPARATION',
    });

    expect(result.success).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
