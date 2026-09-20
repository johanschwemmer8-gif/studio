import { verifyAuth } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';
import { resolveOrganizationScope } from '@/lib/organization-scope-server';
import { resolveReportingCalendar } from '@/lib/reporting-calendar-server';
import { getOverviewMetricTrend } from './get-overview-metric-trend';

jest.mock('@/lib/auth-server', () => ({
  verifyAuth: jest.fn(),
}));

jest.mock('@/lib/firebase-admin', () => ({
  getDb: jest.fn(),
}));

jest.mock('@/lib/organization-scope-server', () => ({
  resolveOrganizationScope: jest.fn(),
}));

jest.mock('@/lib/reporting-calendar-server', () => ({
  resolveReportingCalendar: jest.fn(),
}));

const mockVerifyAuth = verifyAuth as jest.Mock;
const mockGetDb = getDb as jest.Mock;
const mockResolveOrganizationScope =
  resolveOrganizationScope as jest.Mock;
const mockResolveReportingCalendar =
  resolveReportingCalendar as jest.Mock;

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

function firestoreTimestamp(iso: string) {
  return {
    toDate: () => new Date(iso),
  };
}

function deploymentTimestamp(iso: string) {
  const milliseconds = new Date(iso).getTime();

  return {
    seconds: Math.floor(milliseconds / 1000),
    nanoseconds: (milliseconds % 1000) * 1_000_000,
  };
}

function deployment(
  deploymentId: string,
  storeId: string
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
        storeId === 'store_a'
          ? 'Store A'
          : 'Store Outside Scope',
      placement: {},
      status: 'DEPLOYED',
      createdAt: deploymentTimestamp(
        '2026-09-01T08:00:00.000Z'
      ),
      createdBy: 'user_a',
      updatedAt: deploymentTimestamp(
        '2026-09-01T08:00:00.000Z'
      ),
      updatedBy: 'user_a',
    },
  };
}

function shopperSession(
  sessionId: string,
  deploymentId: string,
  startedAt: string
): TestDocument {
  const timestamp = deploymentTimestamp(startedAt);

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
      startedAt: timestamp,
      lastInteractionAt: timestamp,
    },
  };
}

function exposure(
  id: string,
  deploymentId: string,
  timestamp: string
): TestDocument {
  return {
    id,
    data: {
      retailerId: 'retailer_a',
      deploymentId,
      timestamp: firestoreTimestamp(timestamp),
    },
  };
}

function interactionEvent(
  id: string,
  sessionId: string,
  timestamp: string,
  evidenceType: 'explicit' | 'derived' | 'inferred'
): TestDocument {
  return {
    id,
    data: {
      retailerId: 'retailer_a',
      sessionId,
      eventType: 'interaction_signal',
      timestamp: firestoreTimestamp(timestamp),
      metadata: {
        type: 'product_consideration',
        evidenceType,
      },
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

describe('getOverviewMetricTrend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(
      new Date('2026-09-20T10:00:00.000Z')
    );

    mockVerifyAuth.mockResolvedValue(authorizedContext());

    mockResolveOrganizationScope.mockResolvedValue({
      retailerId: 'retailer_a',
      scope: {
        level: 'network',
        networkId: 'network_a',
      },
      storeIds: ['store_a'],
    });

    mockResolveReportingCalendar.mockResolvedValue({
      timezone: 'Africa/Johannesburg',
      financialYearStartMonth: 7,
      weekStartsOn: 1,
      calendarType: 'GREGORIAN_MONTHLY',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test.each([
    ['DAILY', 30],
    ['WEEKLY', 12],
    ['MONTHLY', 12],
    ['YTD', 1],
  ] as const)(
    'returns the locked %s trend period count',
    async (granularity, expectedCount) => {
      const database = firestore({
        deployments: [deployment('deployment_a', 'store_a')],
        qrExposures: [],
      });

      mockGetDb.mockReturnValue(database.db);

      const result = await getOverviewMetricTrend(
        'token',
        {
          metricId: 'qr_exposures',
          granularity,
        }
      );

      expect(result.points).toHaveLength(expectedCount);
    }
  );

  test('caps Financial YTD at now rather than the future financial-year boundary', async () => {
    const database = firestore({
      deployments: [deployment('deployment_a', 'store_a')],
      qrExposures: [],
    });

    mockGetDb.mockReturnValue(database.db);

    const result = await getOverviewMetricTrend(
      'token',
      {
        metricId: 'qr_exposures',
        granularity: 'YTD',
      }
    );

    expect(result.points).toHaveLength(1);
    expect(result.points[0].periodStart).toBe(
      '2026-06-30T22:00:00.000Z'
    );
    expect(result.points[0].periodEnd).toBe(
      '2026-09-20T10:00:00.000Z'
    );
  });

  test('counts only exposure evidence from authorized deployments', async () => {
    const database = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
        deployment('deployment_b', 'store_b'),
      ],
      qrExposures: [
        exposure(
          'exposure_authorized',
          'deployment_a',
          '2026-09-20T08:00:00.000Z'
        ),
        exposure(
          'exposure_outside_scope',
          'deployment_b',
          '2026-09-20T08:30:00.000Z'
        ),
      ],
    });

    mockGetDb.mockReturnValue(database.db);

    const result = await getOverviewMetricTrend(
      'token',
      {
        metricId: 'qr_exposures',
        granularity: 'DAILY',
      }
    );

    const current = result.points.at(-1);

    expect(current).toMatchObject({
      status: 'MEASURED',
      value: 1,
      evidenceCount: 1,
    });
  });

  test('reports authoritative zero activity as NO_ACTIVITY rather than unavailable data', async () => {
    const database = firestore({
      deployments: [deployment('deployment_a', 'store_a')],
      qrExposures: [],
    });

    mockGetDb.mockReturnValue(database.db);

    const result = await getOverviewMetricTrend(
      'token',
      {
        metricId: 'qr_exposures',
        granularity: 'DAILY',
      }
    );

    expect(result.points.at(-1)).toMatchObject({
      status: 'NO_ACTIVITY',
      value: 0,
      evidenceCount: 0,
    });
  });

  test('fails closed instead of displaying partial exposure counts when source exceeds the aggregation boundary', async () => {
    const exposures = Array.from(
      { length: 5001 },
      (_, index) =>
        exposure(
          `exposure_${index}`,
          'deployment_a',
          '2026-09-20T08:00:00.000Z'
        )
    );

    const database = firestore({
      deployments: [deployment('deployment_a', 'store_a')],
      qrExposures: exposures,
    });

    mockGetDb.mockReturnValue(database.db);

    const result = await getOverviewMetricTrend(
      'token',
      {
        metricId: 'qr_exposures',
        granularity: 'DAILY',
      }
    );

    for (const point of result.points) {
      expect(point).toMatchObject({
        status: 'INSUFFICIENT_EVIDENCE',
        value: null,
        evidenceCount: 0,
        reason: 'INCOMPLETE_COVERAGE',
      });
    }
  });

  test('counts Ari Interactions only when the event belongs to a canonical authorized Shopper Session', async () => {
    const database = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
        deployment('deployment_b', 'store_b'),
      ],
      sessions: [
        shopperSession(
          'session_authorized',
          'deployment_a',
          '2026-09-20T07:00:00.000Z'
        ),
        shopperSession(
          'session_outside_scope',
          'deployment_b',
          '2026-09-20T07:00:00.000Z'
        ),
      ],
      events: [
        interactionEvent(
          'event_authorized',
          'session_authorized',
          '2026-09-20T08:00:00.000Z',
          'explicit'
        ),
        interactionEvent(
          'event_outside_scope',
          'session_outside_scope',
          '2026-09-20T08:05:00.000Z',
          'explicit'
        ),
        interactionEvent(
          'event_unknown_session',
          'session_missing',
          '2026-09-20T08:10:00.000Z',
          'explicit'
        ),
      ],
    });

    mockGetDb.mockReturnValue(database.db);

    const result = await getOverviewMetricTrend(
      'token',
      {
        metricId: 'ari_interactions',
        granularity: 'DAILY',
      }
    );

    expect(result.points.at(-1)).toMatchObject({
      status: 'MEASURED',
      value: 1,
      evidenceCount: 1,
    });
  });

  test('excludes inferred interaction signals from factual Decision Signal trend counts', async () => {
    const database = firestore({
      deployments: [deployment('deployment_a', 'store_a')],
      sessions: [
        shopperSession(
          'session_a',
          'deployment_a',
          '2026-09-20T07:00:00.000Z'
        ),
      ],
      events: [
        interactionEvent(
          'explicit_signal',
          'session_a',
          '2026-09-20T08:00:00.000Z',
          'explicit'
        ),
        interactionEvent(
          'derived_signal',
          'session_a',
          '2026-09-20T08:05:00.000Z',
          'derived'
        ),
        interactionEvent(
          'inferred_signal',
          'session_a',
          '2026-09-20T08:10:00.000Z',
          'inferred'
        ),
      ],
    });

    mockGetDb.mockReturnValue(database.db);

    const result = await getOverviewMetricTrend(
      'token',
      {
        metricId: 'decision_signals',
        granularity: 'DAILY',
      }
    );

    expect(result.points.at(-1)).toMatchObject({
      status: 'MEASURED',
      value: 2,
      evidenceCount: 2,
    });
  });

  test.each([
    'conversion_rate_percent',
    'basket_size_increase_percent',
    'basket_size_increase_rand',
    'sales_uplift_percent',
  ] as const)(
    'keeps %s trend evidence-gated rather than fabricating historical commercial values',
    async metricId => {
      const database = firestore({});
      mockGetDb.mockReturnValue(database.db);

      const result = await getOverviewMetricTrend(
        'token',
        {
          metricId,
          granularity: 'DAILY',
        }
      );

      expect(result.points).toHaveLength(30);

      for (const point of result.points) {
        expect(point).toMatchObject({
          status: 'REQUIRES_POS_DATA',
          value: null,
          evidenceCount: 0,
          reason: 'POS_DATA_MISSING',
        });
      }
    }
  );

  test('fails closed when authoritative Reporting Calendar configuration is absent', async () => {
    const database = firestore({});
    mockGetDb.mockReturnValue(database.db);
    mockResolveReportingCalendar.mockResolvedValue(null);

    await expect(
      getOverviewMetricTrend('token', {
        metricId: 'qr_exposures',
        granularity: 'DAILY',
      })
    ).rejects.toThrow('REPORTING_CALENDAR_REQUIRED');
  });
});
