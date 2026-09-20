import { verifyAuth } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';
import { resolveOrganizationScope } from '@/lib/organization-scope-server';
import { getScanStatistics } from './get-scan-statistics';

jest.mock('@/lib/auth-server', () => ({
  verifyAuth: jest.fn(),
}));

jest.mock('@/lib/firebase-admin', () => ({
  getDb: jest.fn(),
}));

jest.mock('@/lib/organization-scope-server', () => ({
  resolveOrganizationScope: jest.fn(),
}));

const mockVerifyAuth = verifyAuth as jest.Mock;
const mockGetDb = getDb as jest.Mock;
const mockResolveOrganizationScope =
  resolveOrganizationScope as jest.Mock;

type TestDocument = {
  id: string;
  data: Record<string, unknown>;
};

function authorizedContext(
  overrides: Record<string, unknown> = {}
) {
  return {
    uid: 'retailer_user',
    retailerId: 'retailer_a',
    role: 'networkAdmin',
    scope: {
      level: 'network',
      networkId: 'network_a',
    },
    permissions: {
      dashboard: true,
      roi: false,
      visualsReporting: true,
      realTime: true,
      abTesting: false,
      systemIntegration: false,
      retailMediaNetwork: false,
      manageUsers: false,
      manageOrganization: false,
      approve: false,
      export: false,
    },
    isActive: true,
    ...overrides,
  };
}

function timestamp(iso: string) {
  const milliseconds = new Date(iso).getTime();

  return {
    seconds: Math.floor(milliseconds / 1000),
    nanoseconds: (milliseconds % 1000) * 1_000_000,
  };
}

function deployment(
  deploymentId: string,
  storeId = 'store_a',
  overrides: Record<string, unknown> = {}
): TestDocument {
  return {
    id: deploymentId,
    data: {
      deploymentId,
      retailerId: 'retailer_a',
      activationId: `activation_${deploymentId}`,
      campaignId: `campaign_${deploymentId}`,
      storeId,
      storeName:
        storeId === 'store_a' ? 'Store A' : 'Store B',
      placement: {},
      qrCodeId: `qr_${deploymentId}`,
      status: 'DEPLOYED',
      createdAt: timestamp('2026-09-01T08:00:00.000Z'),
      createdBy: 'user_a',
      updatedAt: timestamp('2026-09-01T08:00:00.000Z'),
      updatedBy: 'user_a',
      ...overrides,
    },
  };
}

function exposure(
  exposureId: string,
  deploymentId: string,
  occurredAt = '2026-09-20T10:00:00.000Z',
  overrides: Record<string, unknown> = {}
): TestDocument {
  return {
    id: exposureId,
    data: {
      exposureId,
      retailerId: 'retailer_a',
      campaignId: `campaign_${deploymentId}`,
      activationId: `activation_${deploymentId}`,
      deploymentId,
      qrCodeId: `qr_${deploymentId}`,
      configurationVersion: 1,
      environment: 'PRODUCTION',
      timestamp: timestamp(occurredAt),
      ...overrides,
    },
  };
}

function shopperSession(
  sessionId: string,
  deploymentId: string,
  startedAt = '2026-09-20T10:05:00.000Z',
  overrides: Record<string, unknown> = {}
): TestDocument {
  const sessionTimestamp = timestamp(startedAt);

  return {
    id: sessionId,
    data: {
      sessionId,
      retailerId: 'retailer_a',
      campaignId: `campaign_${deploymentId}`,
      activationId: `activation_${deploymentId}`,
      deploymentId,
      qrCodeId: `qr_${deploymentId}`,
      configurationVersion: 1,
      environment: 'PRODUCTION',
      startedAt: sessionTimestamp,
      lastInteractionAt: sessionTimestamp,
      ...overrides,
    },
  };
}

function firestore(
  collections: Record<string, TestDocument[]>
) {
  const calls: Array<{
    collection: string;
    filters: Array<[string, string, unknown]>;
    limit?: number;
  }> = [];

  const collection = jest.fn((collectionName: string) => {
    const filters: Array<[string, string, unknown]> = [];
    let limitValue: number | undefined;

    const query: {
      where: jest.Mock;
      limit: jest.Mock;
      get: jest.Mock;
    } = {
      where: jest.fn(
        (field: string, operator: string, value: unknown) => {
          filters.push([field, operator, value]);
          return query;
        }
      ),

      limit: jest.fn((value: number) => {
        limitValue = value;
        return query;
      }),

      get: jest.fn(async () => {
        calls.push({
          collection: collectionName,
          filters: [...filters],
          limit: limitValue,
        });

        return {
          docs: (collections[collectionName] ?? []).map(
            item => ({
              id: item.id,
              data: () => item.data,
            })
          ),
        };
      }),
    };

    return query;
  });

  return {
    db: { collection },
    calls,
  };
}

describe('getScanStatistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyAuth.mockResolvedValue(authorizedContext());

    mockResolveOrganizationScope.mockResolvedValue({
      retailerId: 'retailer_a',
      scope: {
        level: 'network',
        networkId: 'network_a',
      },
      storeIds: ['store_a', 'store_b'],
    });
  });

  test('fails closed on authentication failure before reading evidence', async () => {
    mockVerifyAuth.mockResolvedValue({
      uid: '',
      error: 'AUTHENTICATION_REQUIRED',
    });

    await expect(
      getScanStatistics(undefined)
    ).rejects.toThrow('AUTHENTICATION_REQUIRED');

    expect(mockGetDb).not.toHaveBeenCalled();
    expect(
      mockResolveOrganizationScope
    ).not.toHaveBeenCalled();
  });

  test('requires dashboard permission before reading evidence', async () => {
    mockVerifyAuth.mockResolvedValue(
      authorizedContext({
        permissions: {
          ...authorizedContext().permissions,
          dashboard: false,
        },
      })
    );

    await expect(
      getScanStatistics('token')
    ).rejects.toThrow('DASHBOARD_ACCESS_DENIED');

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  test('returns authoritative no-activity states from complete empty sources', async () => {
    const store = firestore({
      deployments: [deployment('deployment_a')],
      qrExposures: [],
      sessions: [],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getScanStatistics('token');

    expect(result.qrExposures).toEqual({
      status: 'NO_ACTIVITY',
      value: 0,
    });

    expect(result.qualifyingShopperSessions).toEqual({
      status: 'NO_ACTIVITY',
      value: 0,
    });

    expect(result.exposureToSessionRatePercent).toEqual({
      status: 'UNAVAILABLE',
      value: null,
      reason: 'NO_DENOMINATOR',
    });

    expect(result.activationPerformance).toEqual([]);
  });

  test('counts canonical production exposures and qualifying sessions and groups by Activation, Deployment and QR identity', async () => {
    const store = firestore({
      deployments: [deployment('deployment_a')],
      qrExposures: [
        exposure('exposure_1', 'deployment_a'),
        exposure(
          'exposure_2',
          'deployment_a',
          '2026-09-20T10:10:00.000Z'
        ),
      ],
      sessions: [
        shopperSession(
          'session_1',
          'deployment_a',
          '2026-09-20T10:15:00.000Z'
        ),
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getScanStatistics('token');

    expect(result.qrExposures).toEqual({
      status: 'MEASURED',
      value: 2,
    });

    expect(result.qualifyingShopperSessions).toEqual({
      status: 'MEASURED',
      value: 1,
    });

    expect(
      result.exposureToSessionRatePercent.value
    ).toBe(50);

    expect(result.activationPerformance).toHaveLength(1);

    expect(result.activationPerformance[0]).toMatchObject({
      activationId: 'activation_deployment_a',
      campaignId: 'campaign_deployment_a',
      deploymentId: 'deployment_a',
      qrCodeId: 'qr_deployment_a',
      storeId: 'store_a',
      storeName: 'Store A',
      qrExposures: 2,
      qualifyingShopperSessions: 1,
      exposureToSessionRatePercent: 50,
    });
  });

  test('excludes evidence whose Deployment is outside the authenticated organizational scope', async () => {
    mockResolveOrganizationScope.mockResolvedValue({
      retailerId: 'retailer_a',
      scope: {
        level: 'store',
        networkId: 'network_a',
        brandId: 'brand_a',
        divisionId: 'division_a',
        regionId: 'region_a',
        areaId: 'area_a',
        storeId: 'store_a',
      },
      storeIds: ['store_a'],
    });

    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
        deployment('deployment_b', 'store_b'),
      ],
      qrExposures: [
        exposure('exposure_a', 'deployment_a'),
        exposure('exposure_b', 'deployment_b'),
      ],
      sessions: [
        shopperSession('session_a', 'deployment_a'),
        shopperSession('session_b', 'deployment_b'),
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getScanStatistics('token');

    expect(result.qrExposures.value).toBe(1);
    expect(result.qualifyingShopperSessions.value).toBe(1);
    expect(result.activationPerformance).toHaveLength(1);
    expect(
      result.activationPerformance[0].deploymentId
    ).toBe('deployment_a');
  });

  test('excludes TEST and DEMO evidence from production Scan Statistics', async () => {
    const store = firestore({
      deployments: [deployment('deployment_a')],
      qrExposures: [
        exposure('production_exposure', 'deployment_a'),
        exposure(
          'test_exposure',
          'deployment_a',
          '2026-09-20T10:01:00.000Z',
          { environment: 'TEST' }
        ),
        exposure(
          'demo_exposure',
          'deployment_a',
          '2026-09-20T10:02:00.000Z',
          { environment: 'DEMO' }
        ),
      ],
      sessions: [
        shopperSession('production_session', 'deployment_a'),
        shopperSession(
          'test_session',
          'deployment_a',
          '2026-09-20T10:06:00.000Z',
          { environment: 'TEST' }
        ),
        shopperSession(
          'demo_session',
          'deployment_a',
          '2026-09-20T10:07:00.000Z',
          { environment: 'DEMO' }
        ),
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getScanStatistics('token');

    expect(result.qrExposures.value).toBe(1);
    expect(result.qualifyingShopperSessions.value).toBe(1);
  });

  test('rejects mismatched canonical identity instead of inferring or repairing it', async () => {
    const store = firestore({
      deployments: [deployment('deployment_a')],
      qrExposures: [
        exposure(
          'valid_exposure',
          'deployment_a'
        ),
        exposure(
          'wrong_activation',
          'deployment_a',
          '2026-09-20T10:01:00.000Z',
          { activationId: 'activation_wrong' }
        ),
        exposure(
          'wrong_campaign',
          'deployment_a',
          '2026-09-20T10:02:00.000Z',
          { campaignId: 'campaign_wrong' }
        ),
        exposure(
          'wrong_qr',
          'deployment_a',
          '2026-09-20T10:03:00.000Z',
          { qrCodeId: 'qr_wrong' }
        ),
      ],
      sessions: [
        shopperSession(
          'valid_session',
          'deployment_a'
        ),
        shopperSession(
          'wrong_session_identity',
          'deployment_a',
          '2026-09-20T10:08:00.000Z',
          { qrCodeId: 'qr_wrong' }
        ),
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getScanStatistics('token');

    expect(result.qrExposures.value).toBe(1);
    expect(result.qualifyingShopperSessions.value).toBe(1);
    expect(result.activationPerformance).toHaveLength(1);
  });

  test('retains historical evidence for a removed Deployment', async () => {
    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a', {
          removedAt: timestamp(
            '2026-09-20T12:00:00.000Z'
          ),
          removedBy: 'user_a',
        }),
      ],
      qrExposures: [
        exposure(
          'historical_exposure',
          'deployment_a',
          '2026-09-20T10:00:00.000Z'
        ),
      ],
      sessions: [
        shopperSession(
          'historical_session',
          'deployment_a',
          '2026-09-20T10:05:00.000Z'
        ),
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getScanStatistics('token');

    expect(result.qrExposures.value).toBe(1);
    expect(result.qualifyingShopperSessions.value).toBe(1);
    expect(result.activationPerformance).toHaveLength(1);
  });

  test('fails closed instead of reporting truncated exposure evidence', async () => {
    const tooManyExposures = Array.from(
      { length: 5001 },
      (_, index) =>
        exposure(
          `exposure_${index}`,
          'deployment_a'
        )
    );

    const store = firestore({
      deployments: [deployment('deployment_a')],
      qrExposures: tooManyExposures,
      sessions: [
        shopperSession('session_1', 'deployment_a'),
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getScanStatistics('token');

    expect(result.qrExposures).toEqual({
      status: 'UNAVAILABLE',
      value: null,
      reason: 'INCOMPLETE_COVERAGE',
    });

    expect(result.qualifyingShopperSessions).toEqual({
      status: 'MEASURED',
      value: 1,
    });

    expect(result.exposureToSessionRatePercent).toEqual({
      status: 'UNAVAILABLE',
      value: null,
      reason: 'INCOMPLETE_COVERAGE',
    });

    expect(result.activationPerformance).toEqual([]);
  });

  test('fails closed instead of reporting truncated session evidence', async () => {
    const tooManySessions = Array.from(
      { length: 5001 },
      (_, index) =>
        shopperSession(
          `session_${index}`,
          'deployment_a'
        )
    );

    const store = firestore({
      deployments: [deployment('deployment_a')],
      qrExposures: [
        exposure('exposure_1', 'deployment_a'),
      ],
      sessions: tooManySessions,
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getScanStatistics('token');

    expect(result.qrExposures).toEqual({
      status: 'MEASURED',
      value: 1,
    });

    expect(result.qualifyingShopperSessions).toEqual({
      status: 'UNAVAILABLE',
      value: null,
      reason: 'INCOMPLETE_COVERAGE',
    });

    expect(result.exposureToSessionRatePercent).toEqual({
      status: 'UNAVAILABLE',
      value: null,
      reason: 'INCOMPLETE_COVERAGE',
    });

    expect(result.activationPerformance).toEqual([]);
  });

  test('preserves a qualifying Session without inventing a matching exposure inside the evidence window', async () => {
    const store = firestore({
      deployments: [deployment('deployment_a')],
      qrExposures: [],
      sessions: [
        shopperSession('session_1', 'deployment_a'),
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getScanStatistics('token');

    expect(result.qrExposures).toEqual({
      status: 'NO_ACTIVITY',
      value: 0,
    });

    expect(result.qualifyingShopperSessions).toEqual({
      status: 'MEASURED',
      value: 1,
    });

    expect(result.exposureToSessionRatePercent).toEqual({
      status: 'UNAVAILABLE',
      value: null,
      reason: 'NO_DENOMINATOR',
    });

    expect(result.activationPerformance).toHaveLength(1);
    expect(result.activationPerformance[0]).toMatchObject({
      qrExposures: 0,
      qualifyingShopperSessions: 1,
      exposureToSessionRatePercent: null,
    });
  });

  test('queries only the authoritative Scan Statistics source collections', async () => {
    const store = firestore({
      deployments: [deployment('deployment_a')],
      qrExposures: [],
      sessions: [],
    });

    mockGetDb.mockReturnValue(store.db);

    await getScanStatistics('token');

    const collectionNames = store.calls.map(
      call => call.collection
    );

    expect(collectionNames).toEqual([
      'deployments',
      'qrExposures',
      'sessions',
    ]);

    expect(collectionNames).not.toContain('events');
    expect(collectionNames).not.toContain('transactions');

    const exposureCall = store.calls.find(
      call => call.collection === 'qrExposures'
    );

    const sessionCall = store.calls.find(
      call => call.collection === 'sessions'
    );

    expect(exposureCall?.limit).toBe(5001);
    expect(sessionCall?.limit).toBe(5001);

    expect(exposureCall?.filters).toEqual(
      expect.arrayContaining([
        ['retailerId', '==', 'retailer_a'],
      ])
    );

    expect(sessionCall?.filters).toEqual(
      expect.arrayContaining([
        ['retailerId', '==', 'retailer_a'],
      ])
    );
  });
});
