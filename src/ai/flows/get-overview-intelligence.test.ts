import { verifyAuth } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';
import { resolveOrganizationScope } from '@/lib/organization-scope-server';
import { resolveReportingCalendar } from '@/lib/reporting-calendar-server';
import { getOverviewIntelligence } from './get-overview-intelligence';

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
const mockResolveOrganizationScope = resolveOrganizationScope as jest.Mock;
const mockResolveReportingCalendar = resolveReportingCalendar as jest.Mock;

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
      storeName: storeId === 'store_a' ? 'Store A' : 'Store B',
      placement: {},
      status: 'DEPLOYED',
      createdAt: deploymentTimestamp('2026-09-01T08:00:00.000Z'),
      createdBy: 'user_a',
      updatedAt: deploymentTimestamp('2026-09-01T08:00:00.000Z'),
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

function transaction(
  transactionId: string,
  sessionId: string | undefined,
  timestamp: string,
  overrides: Record<string, unknown> = {}
): TestDocument {
  return {
    id: transactionId,
    data: {
      transactionId,
      retailerId: 'retailer_a',
      amount: 250,
      currency: 'ZAR',
      timestamp: deploymentTimestamp(timestamp),
      ...(sessionId ? { sessionId } : {}),
      storeId: 'store_a',
      source: 'POS',
      dataStatus: 'VERIFIED',
      environment: 'PRODUCTION',
      ...overrides,
    },
  };
}

type TestDocument = {
  id: string;
  data: Record<string, unknown>;
};

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
          docs: (collections[collectionName] ?? []).map(item => ({
            id: item.id,
            data: () => item.data,
          })),
        };
      }),
    };

    return query;
  });

  return {
    db: { collection },
    collection,
    calls,
  };
}

describe('getOverviewIntelligence', () => {
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

    mockResolveReportingCalendar.mockResolvedValue(null);
  });

  test('fails closed on authentication failure before querying Overview evidence', async () => {
    mockVerifyAuth.mockResolvedValue({
      uid: '',
      error: 'Authentication failed.',
    });

    await expect(
      getOverviewIntelligence('bad-token')
    ).rejects.toThrow('Authentication failed.');

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  test('requires dashboard permission before querying Overview evidence', async () => {
    mockVerifyAuth.mockResolvedValue(
      authorizedContext({
        permissions: {
          ...authorizedContext().permissions,
          dashboard: false,
        },
      })
    );

    await expect(
      getOverviewIntelligence('token')
    ).rejects.toThrow('DASHBOARD_ACCESS_DENIED');

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  test('queries every authoritative Overview evidence source within the authenticated retailer tenant', async () => {
    const store = firestore({
      qrExposures: [],
      sessions: [],
      events: [],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.retailerId).toBe('retailer_a');

    expect(
      store.calls.map(call => call.collection).sort()
    ).toEqual([
      'deployments',
      'events',
      'qrExposures',
      'sessions',
      'transactions',
    ]);

    for (const call of store.calls) {
      expect(call.filters).toEqual(
        expect.arrayContaining([
          ['retailerId', '==', 'retailer_a'],
        ])
      );
    }
  });

  test('resolves the authenticated home scope before reading Overview evidence', async () => {
    const store = firestore({
      deployments: [],
      qrExposures: [],
      sessions: [],
      events: [],
    });

    mockGetDb.mockReturnValue(store.db);

    await getOverviewIntelligence('token');

    expect(mockResolveOrganizationScope).toHaveBeenCalledWith(
      'retailer_a',
      expect.objectContaining({
        level: 'network',
        networkId: 'network_a',
      })
    );
  });

  test('excludes evidence belonging to Deployments outside the authenticated organizational scope', async () => {
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

    mockVerifyAuth.mockResolvedValue(
      authorizedContext({
        role: 'storeManager',
        scope: {
          level: 'store',
          networkId: 'network_a',
          brandId: 'brand_a',
          divisionId: 'division_a',
          regionId: 'region_a',
          areaId: 'area_a',
          storeId: 'store_a',
        },
      })
    );

    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
        deployment('deployment_b', 'store_b'),
      ],
      qrExposures: [
        {
          id: 'exposure_a',
          data: {
            retailerId: 'retailer_a',
            deploymentId: 'deployment_a',
            timestamp: firestoreTimestamp('2026-09-19T10:00:00.000Z'),
          },
        },
        {
          id: 'exposure_b',
          data: {
            retailerId: 'retailer_a',
            deploymentId: 'deployment_b',
            timestamp: firestoreTimestamp('2026-09-19T11:00:00.000Z'),
          },
        },
      ],
      sessions: [
        shopperSession(
          'session_a',
          'deployment_a',
          '2026-09-19T10:05:00.000Z'
        ),
        shopperSession(
          'session_b',
          'deployment_b',
          '2026-09-19T11:05:00.000Z'
        ),
      ],
      events: [
        {
          id: 'event_a',
          data: {
            retailerId: 'retailer_a',
            sessionId: 'session_a',
            eventType: 'interaction_signal',
            timestamp: firestoreTimestamp('2026-09-19T10:06:00.000Z'),
            metadata: {
              type: 'information_request',
              evidenceType: 'explicit',
            },
          },
        },
        {
          id: 'event_b',
          data: {
            retailerId: 'retailer_a',
            sessionId: 'session_b',
            eventType: 'interaction_signal',
            timestamp: firestoreTimestamp('2026-09-19T11:06:00.000Z'),
            metadata: {
              type: 'information_request',
              evidenceType: 'explicit',
            },
          },
        },
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.scope.level).toBe('store');
    expect(result.scope.storeId).toBe('store_a');

    expect(result.pointOfDecisionActivity.qrExposures.value).toBe(1);
    expect(
      result.pointOfDecisionActivity.qualifyingShopperSessions.value
    ).toBe(1);
    expect(result.pointOfDecisionActivity.ariInteractions.value).toBe(1);
    expect(result.activityIntelligence.informationRequests.value).toBe(1);

    expect(result.freshness.latestEvidenceAt).toBe(
      '2026-09-19T10:06:00.000Z'
    );
  });

  test('retains authoritative historical evidence from a removed Deployment', async () => {
    const removedDeployment = deployment(
      'deployment_removed',
      'store_a'
    );

    removedDeployment.data.removedAt = deploymentTimestamp(
      '2026-09-15T12:00:00.000Z'
    );
    removedDeployment.data.removedBy = 'user_a';

    const store = firestore({
      deployments: [
        removedDeployment,
      ],
      qrExposures: [
        {
          id: 'exposure_before_removal',
          data: {
            retailerId: 'retailer_a',
            deploymentId: 'deployment_removed',
            timestamp: firestoreTimestamp(
              '2026-09-10T08:00:00.000Z'
            ),
          },
        },
      ],
      sessions: [
        shopperSession(
          'session_before_removal',
          'deployment_removed',
          '2026-09-10T08:01:00.000Z'
        ),
      ],
      events: [],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.pointOfDecisionActivity.qrExposures).toMatchObject({
      status: 'MEASURED',
      value: 1,
    });

    expect(
      result.pointOfDecisionActivity.qualifyingShopperSessions
    ).toMatchObject({
      status: 'MEASURED',
      value: 1,
    });
  });

  test('returns authoritative no-activity states instead of fabricated zero measurements', async () => {
    const store = firestore({
      qrExposures: [],
      sessions: [],
      events: [],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.pointOfDecisionActivity.qrExposures).toMatchObject({
      status: 'NO_ACTIVITY',
      value: 0,
      evidenceCount: 0,
    });

    expect(
      result.pointOfDecisionActivity.qualifyingShopperSessions
    ).toMatchObject({
      status: 'NO_ACTIVITY',
      value: 0,
      evidenceCount: 0,
    });

    expect(result.pointOfDecisionActivity.ariInteractions).toMatchObject({
      status: 'NO_ACTIVITY',
      value: 0,
      evidenceCount: 0,
    });

    expect(result.pointOfDecisionActivity.decisionSignals).toMatchObject({
      status: 'NO_ACTIVITY',
      value: 0,
      evidenceCount: 0,
    });

    expect(result.groundedSummary.status).toBe('NO_ACTIVITY');
    expect(result.freshness.latestEvidenceAt).toBeNull();
  });

  test('keeps all four commercial outcomes POS-gated with null values', async () => {
    const store = firestore({
      qrExposures: [],
      sessions: [],
      events: [],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    const commercialMetrics = [
      result.commercialOutcomes.basketSizeIncreasePercent,
      result.commercialOutcomes.basketSizeIncreaseRand,
      result.commercialOutcomes.salesUpliftPercent,
      result.commercialOutcomes.conversionRatePercent,
    ];

    for (const metric of commercialMetrics) {
      expect(metric.status).toBe('REQUIRES_POS_DATA');
      expect(metric.value).toBeNull();
      expect(metric.reason).toBe('POS_DATA_MISSING');
      expect(metric.statusDetail).toBe('Requires POS Data');
    }

    expect(
      result.commercialOutcomes.basketSizeIncreasePercent.evidenceLevel
    ).toBe('E3');

    expect(
      result.commercialOutcomes.basketSizeIncreaseRand.evidenceLevel
    ).toBe('E3');

    expect(
      result.commercialOutcomes.salesUpliftPercent.evidenceLevel
    ).toBe('E4');

    expect(
      result.commercialOutcomes.conversionRatePercent.evidenceLevel
    ).toBe('E2');
  });

  test('keeps Basket Size Increase unavailable when production transaction evidence exists but no authoritative E3 comparison baseline exists', async () => {
    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [],
      sessions: [
        shopperSession(
          'session_1',
          'deployment_a',
          '2026-09-20T08:00:00.000Z'
        ),
      ],
      events: [],
      transactions: [
        transaction(
          'transaction_1',
          'session_1',
          '2026-09-20T08:10:00.000Z'
        ),
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(
      result.commercialOutcomes.basketSizeIncreasePercent
    ).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      unit: 'PERCENT',
      evidenceLevel: 'E3',
      evidenceCount: 0,
      reason: 'BASELINE_UNAVAILABLE',
    });

    expect(
      result.commercialOutcomes.basketSizeIncreaseRand
    ).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      unit: 'RAND',
      evidenceLevel: 'E3',
      evidenceCount: 0,
      reason: 'BASELINE_UNAVAILABLE',
    });


    expect(
      result.commercialOutcomes.salesUpliftPercent
    ).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      unit: 'PERCENT',
      evidenceLevel: 'E4',
      evidenceCount: 0,
      reason: 'BASELINE_UNAVAILABLE',
    });
  });

  test('does not unlock Conversion Rate from E2 attribution until full denominator transaction coverage is authoritative', async () => {
    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [],
      sessions: [
        shopperSession(
          'session_1',
          'deployment_a',
          '2026-09-20T08:00:00.000Z'
        ),
        shopperSession(
          'session_2',
          'deployment_a',
          '2026-09-20T08:05:00.000Z'
        ),
      ],
      events: [],
      transactions: [
        transaction(
          'transaction_1',
          'session_1',
          '2026-09-20T08:10:00.000Z'
        ),
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.commercialOutcomes.conversionRatePercent).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      unit: 'PERCENT',
      evidenceLevel: 'E2',
      evidenceCount: 1,
      reason: 'INCOMPLETE_COVERAGE',
    });
  });

  test('deduplicates multiple E2 purchases to one converted Session while Conversion remains coverage-gated', async () => {
    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [],
      sessions: [
        shopperSession(
          'session_1',
          'deployment_a',
          '2026-09-20T08:00:00.000Z'
        ),
        shopperSession(
          'session_2',
          'deployment_a',
          '2026-09-20T08:05:00.000Z'
        ),
      ],
      events: [],
      transactions: [
        transaction(
          'transaction_1',
          'session_1',
          '2026-09-20T08:10:00.000Z'
        ),
        transaction(
          'transaction_2',
          'session_1',
          '2026-09-20T08:12:00.000Z'
        ),
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.commercialOutcomes.conversionRatePercent).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      evidenceLevel: 'E2',
      evidenceCount: 1,
      reason: 'INCOMPLETE_COVERAGE',
    });
  });

  test('does not allow TEST or DEMO transaction evidence to unlock production Conversion Rate', async () => {
    for (const environment of ['TEST', 'DEMO']) {
      const store = firestore({
        deployments: [
          deployment('deployment_a', 'store_a'),
        ],
        qrExposures: [],
        sessions: [
          shopperSession(
            'session_1',
            'deployment_a',
            '2026-09-20T08:00:00.000Z'
          ),
        ],
        events: [],
        transactions: [
          transaction(
            `transaction_${environment.toLowerCase()}`,
            'session_1',
            '2026-09-20T08:10:00.000Z',
            { environment }
          ),
        ],
      });

      mockGetDb.mockReturnValue(store.db);

      const result = await getOverviewIntelligence('token');

      expect(result.commercialOutcomes.conversionRatePercent).toMatchObject({
        status: 'REQUIRES_POS_DATA',
        value: null,
        reason: 'POS_DATA_MISSING',
        evidenceLevel: 'E2',
      });
    }
  });

  test('does not manufacture zero Conversion Rate when production transactions lack deterministic E2 attribution', async () => {
    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [],
      sessions: [
        shopperSession(
          'session_1',
          'deployment_a',
          '2026-09-20T08:00:00.000Z'
        ),
      ],
      events: [],
      transactions: [
        transaction(
          'transaction_unattributed',
          undefined,
          '2026-09-20T08:10:00.000Z'
        ),
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.commercialOutcomes.conversionRatePercent).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      reason: 'ATTRIBUTION_UNAVAILABLE',
      evidenceLevel: 'E2',
    });
  });

  test('fails closed instead of calculating Conversion Rate from truncated transaction evidence', async () => {
    const transactions = Array.from({ length: 5001 }, (_, index) =>
      transaction(
        `transaction_${index}`,
        'session_1',
        '2026-09-20T08:10:00.000Z'
      )
    );

    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [],
      sessions: [
        shopperSession(
          'session_1',
          'deployment_a',
          '2026-09-20T08:00:00.000Z'
        ),
      ],
      events: [],
      transactions,
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.commercialOutcomes.conversionRatePercent).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      reason: 'INCOMPLETE_COVERAGE',
      evidenceLevel: 'E2',
      evidenceCount: 0,
    });
  });

  test('counts only authoritative session-anchored evidence and excludes inferred signals from factual decision metrics', async () => {
    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [
        {
          id: 'exposure_1',
          data: {
            retailerId: 'retailer_a',
            deploymentId: 'deployment_a',
            timestamp: firestoreTimestamp('2026-09-20T08:00:00.000Z'),
          },
        },
        {
          id: 'exposure_2',
          data: {
            retailerId: 'retailer_a',
            deploymentId: 'deployment_a',
            timestamp: firestoreTimestamp('2026-09-20T08:05:00.000Z'),
          },
        },
      ],

      sessions: [
        shopperSession(
          'session_1',
          'deployment_a',
          '2026-09-20T08:10:00.000Z'
        ),
      ],

      events: [
        {
          id: 'information_request_1',
          data: {
            retailerId: 'retailer_a',
            sessionId: 'session_1',
            eventType: 'interaction_signal',
            timestamp: firestoreTimestamp('2026-09-20T08:11:00.000Z'),
            metadata: {
              evidenceType: 'explicit',
              type: 'information_request',
            },
          },
        },
        {
          id: 'comparison_1',
          data: {
            retailerId: 'retailer_a',
            sessionId: 'session_1',
            eventType: 'interaction_signal',
            timestamp: firestoreTimestamp('2026-09-20T08:12:00.000Z'),
            metadata: {
              evidenceType: 'derived',
              type: 'product_comparison',
            },
          },
        },
        {
          id: 'inferred_barrier',
          data: {
            retailerId: 'retailer_a',
            sessionId: 'session_1',
            eventType: 'interaction_signal',
            timestamp: firestoreTimestamp('2026-09-20T08:13:00.000Z'),
            metadata: {
              evidenceType: 'inferred',
              type: 'purchase_barrier',
            },
          },
        },
        {
          id: 'orphan_event',
          data: {
            retailerId: 'retailer_a',
            sessionId: 'not_a_canonical_session',
            eventType: 'interaction_signal',
            timestamp: firestoreTimestamp('2026-09-20T08:14:00.000Z'),
            metadata: {
              evidenceType: 'explicit',
              type: 'product_consideration',
            },
          },
        },
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.pointOfDecisionActivity.qrExposures.value).toBe(2);

    expect(
      result.pointOfDecisionActivity.qualifyingShopperSessions.value
    ).toBe(1);

    /*
     * Ari interactions include all canonical session-anchored interaction
     * events, including inferred interpretation events.
     */
    expect(result.pointOfDecisionActivity.ariInteractions.value).toBe(3);

    /*
     * Factual decision signals exclude inferred evidence.
     */
    expect(result.pointOfDecisionActivity.decisionSignals.value).toBe(2);

    expect(result.activityIntelligence.informationRequests.value).toBe(1);
    expect(result.activityIntelligence.productComparisons.value).toBe(1);

    expect(
      result.activityIntelligence.purchaseBarriersConcerns.value
    ).toBe(0);

    expect(result.activityIntelligence.productConsideration.value).toBe(0);
  });

  test('derives freshness from the newest authoritative evidence timestamp', async () => {
    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [
        {
          id: 'exposure_1',
          data: {
            retailerId: 'retailer_a',
            deploymentId: 'deployment_a',
            timestamp: firestoreTimestamp('2026-09-20T08:00:00.000Z'),
          },
        },
      ],

      sessions: [
        shopperSession(
          'session_1',
          'deployment_a',
          '2026-09-20T08:10:00.000Z'
        ),
      ],

      events: [
        {
          id: 'event_1',
          data: {
            retailerId: 'retailer_a',
            sessionId: 'session_1',
            eventType: 'interaction_signal',
            timestamp: firestoreTimestamp('2026-09-20T08:15:00.000Z'),
            metadata: {
              evidenceType: 'explicit',
              type: 'information_request',
            },
          },
        },
      ],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.freshness.latestEvidenceAt).toBe(
      '2026-09-20T08:15:00.000Z'
    );

    expect(
      Number.isNaN(Date.parse(result.freshness.calculatedAt))
    ).toBe(false);
  });

  test('fails closed instead of reporting a truncated QR exposure measurement', async () => {
    const exposures = Array.from({ length: 5001 }, (_, index) => ({
      id: `exposure_${index}`,
      data: {
        retailerId: 'retailer_a',
        deploymentId: 'deployment_a',
        timestamp: firestoreTimestamp('2026-09-20T08:00:00.000Z'),
      },
    }));

    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: exposures,
      sessions: [],
      events: [],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.pointOfDecisionActivity.qrExposures).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      evidenceCount: 0,
      reason: 'INCOMPLETE_COVERAGE',
    });

    expect(
      result.pointOfDecisionActivity.qualifyingShopperSessions
    ).toMatchObject({
      status: 'NO_ACTIVITY',
      value: 0,
    });

    expect(result.groundedSummary.status).toBe('UNAVAILABLE');
    expect(result.groundedSummary.factualObservations).toHaveLength(0);
  });

  test('fails closed for session-dependent metrics when session coverage is incomplete', async () => {
    const sessions = Array.from({ length: 5001 }, (_, index) => ({
      id: `session_${index}`,
      data: {
        retailerId: 'retailer_a',
        deploymentId: 'deployment_a',
        startedAt: firestoreTimestamp('2026-09-20T08:00:00.000Z'),
      },
    }));

    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [],
      sessions,
      events: [],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(
      result.pointOfDecisionActivity.qualifyingShopperSessions
    ).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      reason: 'INCOMPLETE_COVERAGE',
    });

    expect(result.pointOfDecisionActivity.ariInteractions).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      reason: 'INCOMPLETE_COVERAGE',
    });

    expect(result.activityIntelligence.informationRequests).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      reason: 'INCOMPLETE_COVERAGE',
    });

    expect(result.groundedSummary.status).toBe('UNAVAILABLE');
  });

  test('keeps complete exposure and session metrics while failing closed on incomplete event coverage', async () => {
    const events = Array.from({ length: 5001 }, (_, index) => ({
      id: `event_${index}`,
      data: {
        retailerId: 'retailer_a',
        sessionId: 'session_a',
        eventType: 'interaction_signal',
        timestamp: firestoreTimestamp('2026-09-20T08:15:00.000Z'),
        metadata: {
          type: 'information_request',
          evidenceType: 'explicit',
        },
      },
    }));

    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [
        {
          id: 'exposure_a',
          data: {
            retailerId: 'retailer_a',
            deploymentId: 'deployment_a',
            timestamp: firestoreTimestamp('2026-09-20T08:00:00.000Z'),
          },
        },
      ],
      sessions: [
        shopperSession(
          'session_a',
          'deployment_a',
          '2026-09-20T08:05:00.000Z'
        ),
      ],
      events,
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.pointOfDecisionActivity.qrExposures).toMatchObject({
      status: 'MEASURED',
      value: 1,
    });

    expect(
      result.pointOfDecisionActivity.qualifyingShopperSessions
    ).toMatchObject({
      status: 'MEASURED',
      value: 1,
    });

    expect(result.pointOfDecisionActivity.ariInteractions).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      reason: 'INCOMPLETE_COVERAGE',
    });

    expect(result.pointOfDecisionActivity.decisionSignals).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      reason: 'INCOMPLETE_COVERAGE',
    });

    expect(result.activityIntelligence.informationRequests).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      reason: 'INCOMPLETE_COVERAGE',
    });

    expect(result.groundedSummary.status).toBe('UNAVAILABLE');
  });

  test('does not invent an arbitrary minimum evidence count for an authoritative activity summary', async () => {
    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [
        {
          id: 'exposure_a',
          data: {
            retailerId: 'retailer_a',
            deploymentId: 'deployment_a',
            timestamp: firestoreTimestamp(
              '2026-09-20T08:00:00.000Z'
            ),
          },
        },
      ],
      sessions: [],
      events: [],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.pointOfDecisionActivity.qrExposures).toMatchObject({
      status: 'MEASURED',
      value: 1,
      evidenceCount: 1,
    });

    expect(result.groundedSummary.status).toBe('AVAILABLE');

    expect(
      result.groundedSummary.factualObservations
    ).toHaveLength(1);

    expect(
      result.groundedSummary.factualObservations[0].supportingMetricIds
    ).toEqual([
      'qr_exposures',
      'qualifying_shopper_sessions',
    ]);
  });

  test('uses the authoritative retailer reporting calendar in the Overview time window', async () => {
    mockResolveReportingCalendar.mockResolvedValue({
      timezone: 'Africa/Johannesburg',
      financialYearStartMonth: 7,
      weekStartsOn: 1,
      calendarType: 'GREGORIAN_MONTHLY',
    });

    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [],
      sessions: [],
      events: [],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(mockResolveReportingCalendar).toHaveBeenCalledWith(
      'retailer_a'
    );

    expect(result.timeWindow).toMatchObject({
      financialYearStartMonth: 7,
      timezone: 'Africa/Johannesburg',
    });
  });

  test('does not manufacture reporting-calendar values when the retailer has not configured them', async () => {
    mockResolveReportingCalendar.mockResolvedValue(null);

    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [
        {
          id: 'exposure_a',
          data: {
            retailerId: 'retailer_a',
            deploymentId: 'deployment_a',
            timestamp: firestoreTimestamp(
              '2026-09-20T08:00:00.000Z'
            ),
          },
        },
      ],
      sessions: [],
      events: [],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');

    expect(result.timeWindow).toMatchObject({
      financialYearStartMonth: null,
      timezone: null,
    });

    expect(result.pointOfDecisionActivity.qrExposures).toMatchObject({
      status: 'MEASURED',
      value: 1,
    });
  });

  test('fails closed when authoritative reporting-calendar resolution fails', async () => {
    mockResolveReportingCalendar.mockRejectedValue(
      new Error('REPORTING_CALENDAR_TENANT_MISMATCH')
    );

    const store = firestore({
      deployments: [
        deployment('deployment_a', 'store_a'),
      ],
      qrExposures: [],
      sessions: [],
      events: [],
    });

    mockGetDb.mockReturnValue(store.db);

    await expect(
      getOverviewIntelligence('token')
    ).rejects.toThrow(
      'REPORTING_CALENDAR_TENANT_MISMATCH'
    );
  });

  test('returns a contract with no simulated production data status', async () => {
    const store = firestore({
      qrExposures: [],
      sessions: [],
      events: [],
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await getOverviewIntelligence('token');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('SIMULATED');
    expect(serialized).not.toContain('"14.8"');
    expect(serialized).not.toContain('"22.4"');
    expect(serialized).not.toContain('"18.2"');
    expect(serialized).not.toContain('185.5');
  });
});
