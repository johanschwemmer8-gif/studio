import {
  assembleProfitRoiBreakdown,
  assembleProfitRoiTrend,
  extractProfitRoiAnalysisMetrics,
} from '@/lib/profit-roi-analysis';
import type {
  ProfitRoiMetric,
  ProfitRoiSnapshot,
} from '@/lib/schemas/profit-roi';

function metric(
  overrides: Partial<ProfitRoiMetric> = {}
): ProfitRoiMetric {
  return {
    status: 'UNAVAILABLE',
    value: null,
    unit: 'RAND',
    currency: 'ZAR',
    evidenceLevel: 'E0',
    evidenceCount: 0,
    reason: 'SOURCE_UNAVAILABLE',
    source: 'test',
    ...overrides,
  };
}

function countMetric(
  overrides: Partial<ProfitRoiMetric> = {}
): ProfitRoiMetric {
  return metric({
    unit: 'COUNT',
    currency: null,
    ...overrides,
  });
}

function percentMetric(
  overrides: Partial<ProfitRoiMetric> = {}
): ProfitRoiMetric {
  return metric({
    unit: 'PERCENT',
    currency: null,
    ...overrides,
  });
}

function snapshot(): ProfitRoiSnapshot {
  return {
    scope: {
      level: 'network',
      networkId: 'network_a',
      displayName: 'Test Network',
    },
    reportingPeriod: {
      granularity: 'MONTHLY',
      startAt: '2026-09-01T00:00:00.000Z',
      endAt: '2026-10-01T00:00:00.000Z',
      timezone: 'Africa/Johannesburg',
      financialYearStartMonth: 3,
    },
    calculatedAt: '2026-09-23T18:00:00.000Z',
    latestEvidenceAt: null,

    investment: {
      saasInvestment: metric({
        reason: 'LICENCE_COST_UNAVAILABLE',
        evidenceLevel: 'E1',
      }),
    },

    retailMedia: {
      retailMediaRevenue: metric({
        reason: 'RETAIL_MEDIA_REVENUE_UNAVAILABLE',
        evidenceLevel: 'E1',
      }),
      brandTurnover: metric(),
      attributedSales: metric({
        reason: 'ATTRIBUTION_UNAVAILABLE',
        evidenceLevel: 'E2',
      }),
      rmnDeliveryCosts: metric({
        reason: 'RMN_DELIVERY_COST_UNAVAILABLE',
        evidenceLevel: 'E1',
      }),
      netRetailMediaContribution: metric(),
      licenceCostOffsetPercentage: percentMetric({
        reason: 'LICENCE_COST_UNAVAILABLE',
        evidenceLevel: 'E1',
      }),
      remainingLicenceCost: metric(),
      surplusAboveLicenceCost: metric(),
    },

    commerce: {
      verifiedPurchases: countMetric({
        status: 'REQUIRES_POS_DATA',
        reason: 'POS_DATA_MISSING',
        evidenceLevel: 'E2',
      }),
      attributedSales: metric({
        status: 'REQUIRES_POS_DATA',
        reason: 'POS_DATA_MISSING',
        evidenceLevel: 'E2',
      }),
      conversionRatePercentage: percentMetric({
        status: 'REQUIRES_POS_DATA',
        reason: 'POS_DATA_MISSING',
        evidenceLevel: 'E2',
      }),
      averageAttributedBasket: metric({
        status: 'REQUIRES_POS_DATA',
        reason: 'POS_DATA_MISSING',
        evidenceLevel: 'E2',
      }),
      basketIncreaseRand: metric({
        status: 'INSUFFICIENT_EVIDENCE',
        reason: 'BASELINE_UNAVAILABLE',
        evidenceLevel: 'E3',
      }),
      basketIncreasePercentage: percentMetric({
        status: 'INSUFFICIENT_EVIDENCE',
        reason: 'BASELINE_UNAVAILABLE',
        evidenceLevel: 'E3',
      }),
      incrementalSales: metric({
        status: 'INSUFFICIENT_EVIDENCE',
        reason: 'COUNTERFACTUAL_UNAVAILABLE',
        evidenceLevel: 'E4',
      }),
      salesUpliftPercentage: percentMetric({
        status: 'INSUFFICIENT_EVIDENCE',
        reason: 'COUNTERFACTUAL_UNAVAILABLE',
        evidenceLevel: 'E4',
      }),
    },

    profit: {
      marginBasis: null,
      incrementalProfitContribution: metric({
        status: 'INSUFFICIENT_EVIDENCE',
        reason: 'MARGIN_DATA_MISSING',
        evidenceLevel: 'E4',
      }),
    },

    reconciliation: {
      totalFinancialBenefit: metric({
        evidenceLevel: 'E4',
      }),
      netFinancialBenefit: metric({
        evidenceLevel: 'E4',
      }),
      roiPercentage: percentMetric({
        evidenceLevel: 'E4',
      }),
    },

    funnel: {
      qrExposures: countMetric({
        status: 'NO_ACTIVITY',
        value: 0,
        evidenceLevel: 'E0',
        evidenceCount: 0,
        reason: undefined,
      }),
      qualifyingShopperSessions: countMetric({
        status: 'NO_ACTIVITY',
        value: 0,
        evidenceLevel: 'E0',
        evidenceCount: 0,
        reason: undefined,
      }),
      ariInteractions: countMetric({
        status: 'NO_ACTIVITY',
        value: 0,
        evidenceLevel: 'E0',
        evidenceCount: 0,
        reason: undefined,
      }),
      supportedDecisionSignals: countMetric({
        status: 'NO_ACTIVITY',
        value: 0,
        evidenceLevel: 'E0',
        evidenceCount: 0,
        reason: undefined,
      }),
      verifiedPurchases: countMetric({
        status: 'REQUIRES_POS_DATA',
        reason: 'POS_DATA_MISSING',
        evidenceLevel: 'E2',
      }),
      attributedSales: metric({
        status: 'REQUIRES_POS_DATA',
        reason: 'POS_DATA_MISSING',
        evidenceLevel: 'E2',
      }),
    },
  };
}

describe('extractProfitRoiAnalysisMetrics', () => {
  test('extracts exactly the eight approved financial analysis metrics', () => {
    const input = snapshot();

    input.investment.saasInvestment = metric({
      status: 'MEASURED',
      value: 18500,
      evidenceLevel: 'E1',
      evidenceCount: 1,
      reason: undefined,
      source: 'authoritative_billing',
    });

    input.retailMedia.retailMediaRevenue = metric({
      status: 'MEASURED',
      value: 9000,
      evidenceLevel: 'E1',
      evidenceCount: 3,
      reason: undefined,
      source: 'authoritative_rmn_revenue',
    });

    input.retailMedia.licenceCostOffsetPercentage = percentMetric({
      status: 'MEASURED',
      value: 48.65,
      evidenceLevel: 'E1',
      evidenceCount: 3,
      reason: undefined,
      source: 'financial_reconciliation',
    });

    input.commerce.attributedSales = metric({
      status: 'MEASURED',
      value: 1250,
      evidenceLevel: 'E2',
      evidenceCount: 2,
      reason: undefined,
      source: 'deterministic_attribution',
    });

    const result = extractProfitRoiAnalysisMetrics(input);

    expect(Object.keys(result).sort()).toEqual(
      [
        'saasInvestment',
        'retailMediaRevenue',
        'licenceCostOffsetPercentage',
        'attributedSales',
        'incrementalSales',
        'incrementalProfitContribution',
        'netFinancialBenefit',
        'roiPercentage',
      ].sort()
    );

    expect(result.saasInvestment).toEqual(
      input.investment.saasInvestment
    );
    expect(result.retailMediaRevenue).toEqual(
      input.retailMedia.retailMediaRevenue
    );
    expect(result.licenceCostOffsetPercentage).toEqual(
      input.retailMedia.licenceCostOffsetPercentage
    );
    expect(result.attributedSales).toEqual(
      input.commerce.attributedSales
    );
    expect(result.incrementalSales).toEqual(
      input.commerce.incrementalSales
    );
    expect(result.incrementalProfitContribution).toEqual(
      input.profit.incrementalProfitContribution
    );
    expect(result.netFinancialBenefit).toEqual(
      input.reconciliation.netFinancialBenefit
    );
    expect(result.roiPercentage).toEqual(
      input.reconciliation.roiPercentage
    );
  });

  test('preserves unavailable and insufficient evidence without manufacturing values', () => {
    const input = snapshot();
    const result = extractProfitRoiAnalysisMetrics(input);

    expect(result.saasInvestment).toMatchObject({
      status: 'UNAVAILABLE',
      value: null,
      reason: 'LICENCE_COST_UNAVAILABLE',
      evidenceLevel: 'E1',
    });

    expect(result.incrementalSales).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      reason: 'COUNTERFACTUAL_UNAVAILABLE',
      evidenceLevel: 'E4',
    });

    expect(result.incrementalProfitContribution).toMatchObject({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      reason: 'MARGIN_DATA_MISSING',
      evidenceLevel: 'E4',
    });

    expect(result.roiPercentage.value).toBeNull();
  });

  test('preserves a legitimate authoritative NO_ACTIVITY zero unchanged', () => {
    const input = snapshot();

    input.commerce.attributedSales = metric({
      status: 'NO_ACTIVITY',
      value: 0,
      evidenceLevel: 'E2',
      evidenceCount: 0,
      reason: undefined,
      source: 'deterministic_attribution',
    });

    const result = extractProfitRoiAnalysisMetrics(input);

    expect(result.attributedSales).toEqual(
      input.commerce.attributedSales
    );
    expect(result.attributedSales.status).toBe('NO_ACTIVITY');
    expect(result.attributedSales.value).toBe(0);
  });
});

describe('assembleProfitRoiTrend', () => {
  test('preserves each historical snapshot period and evidence independently', () => {
    const september = snapshot();
    september.commerce.attributedSales = metric({
      status: 'MEASURED',
      value: 1250,
      evidenceLevel: 'E2',
      evidenceCount: 2,
      reason: undefined,
      source: 'deterministic_attribution',
    });

    const august = snapshot();
    august.reportingPeriod = {
      ...august.reportingPeriod,
      startAt: '2026-08-01T00:00:00.000Z',
      endAt: '2026-09-01T00:00:00.000Z',
    };
    august.commerce.attributedSales = metric({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      evidenceLevel: 'E2',
      evidenceCount: 0,
      reason: 'ATTRIBUTION_UNAVAILABLE',
      source: 'deterministic_attribution',
    });

    const result = assembleProfitRoiTrend(
      'MONTHLY',
      [august, september]
    );

    expect(result.points).toHaveLength(2);

    expect(result.points[0].reportingPeriod).toEqual(
      august.reportingPeriod
    );
    expect(result.points[0].metrics.attributedSales).toEqual(
      august.commerce.attributedSales
    );

    expect(result.points[1].reportingPeriod).toEqual(
      september.reportingPeriod
    );
    expect(result.points[1].metrics.attributedSales).toEqual(
      september.commerce.attributedSales
    );
  });

  test('does not interpolate or synthesize missing historical evidence', () => {
    const first = snapshot();
    const second = snapshot();

    second.reportingPeriod = {
      ...second.reportingPeriod,
      startAt: '2026-08-01T00:00:00.000Z',
      endAt: '2026-09-01T00:00:00.000Z',
    };

    first.commerce.incrementalSales = metric({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      evidenceLevel: 'E4',
      reason: 'COUNTERFACTUAL_UNAVAILABLE',
    });

    second.commerce.incrementalSales = metric({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      evidenceLevel: 'E4',
      reason: 'COUNTERFACTUAL_UNAVAILABLE',
    });

    const result = assembleProfitRoiTrend(
      'MONTHLY',
      [second, first]
    );

    expect(
      result.points.map(
        point => point.metrics.incrementalSales.value
      )
    ).toEqual([null, null]);

    expect(
      result.points.map(
        point => point.metrics.incrementalSales.status
      )
    ).toEqual([
      'INSUFFICIENT_EVIDENCE',
      'INSUFFICIENT_EVIDENCE',
    ]);
  });

  test('fails closed when a snapshot reporting granularity contradicts the trend', () => {
    const input = snapshot();

    expect(() =>
      assembleProfitRoiTrend('DAILY', [input])
    ).toThrow('TREND_GRANULARITY_MISMATCH');
  });
});

describe('assembleProfitRoiBreakdown', () => {
  function brandSnapshot(
    brandId: string,
    displayName: string
  ): ProfitRoiSnapshot {
    const input = snapshot();

    input.scope = {
      level: 'brand',
      networkId: 'network_a',
      brandId,
      displayName,
    };

    return input;
  }

  test('preserves independent child financial evidence without aggregation', () => {
    const brandA = brandSnapshot('brand_a', 'Brand A');
    const brandB = brandSnapshot('brand_b', 'Brand B');

    brandA.commerce.attributedSales = metric({
      status: 'MEASURED',
      value: 1250,
      evidenceLevel: 'E2',
      evidenceCount: 2,
      reason: undefined,
      source: 'deterministic_attribution',
    });

    brandB.commerce.attributedSales = metric({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      evidenceLevel: 'E2',
      evidenceCount: 0,
      reason: 'ATTRIBUTION_UNAVAILABLE',
      source: 'deterministic_attribution',
    });

    const result = assembleProfitRoiBreakdown(
      snapshot().scope,
      snapshot().reportingPeriod,
      [
        {
          scope: brandA.scope,
          displayName: 'Brand A',
          snapshot: brandA,
        },
        {
          scope: brandB.scope,
          displayName: 'Brand B',
          snapshot: brandB,
        },
      ]
    );

    expect(result.breakdownLevel).toBe('brand');
    expect(result.rows).toHaveLength(2);

    expect(result.rows[0].metrics.attributedSales).toEqual(
      brandA.commerce.attributedSales
    );
    expect(result.rows[1].metrics.attributedSales).toEqual(
      brandB.commerce.attributedSales
    );

    expect(result.rows[0].metrics.attributedSales.value).toBe(1250);
    expect(result.rows[1].metrics.attributedSales.value).toBeNull();
  });

  test('does not synthesize a parent total from child rows', () => {
    const parent = snapshot();
    const brandA = brandSnapshot('brand_a', 'Brand A');
    const brandB = brandSnapshot('brand_b', 'Brand B');

    brandA.commerce.attributedSales = metric({
      status: 'MEASURED',
      value: 1000,
      evidenceLevel: 'E2',
      evidenceCount: 1,
      reason: undefined,
    });

    brandB.commerce.attributedSales = metric({
      status: 'MEASURED',
      value: 2000,
      evidenceLevel: 'E2',
      evidenceCount: 1,
      reason: undefined,
    });

    const result = assembleProfitRoiBreakdown(
      parent.scope,
      parent.reportingPeriod,
      [
        {
          scope: brandA.scope,
          displayName: 'Brand A',
          snapshot: brandA,
        },
        {
          scope: brandB.scope,
          displayName: 'Brand B',
          snapshot: brandB,
        },
      ]
    );

    expect(result).not.toHaveProperty('metrics');
    expect(result).not.toHaveProperty('total');
    expect(result.rows.map(row =>
      row.metrics.attributedSales.value
    )).toEqual([1000, 2000]);
  });

  test('returns a terminal empty breakdown without inventing a child level', () => {
    const store = snapshot();
    store.scope = {
      level: 'store',
      networkId: 'network_a',
      brandId: 'brand_a',
      divisionId: 'division_a',
      regionId: 'region_a',
      areaId: 'area_a',
      storeId: 'store_a',
      displayName: 'Store A',
    };

    const result = assembleProfitRoiBreakdown(
      store.scope,
      store.reportingPeriod,
      []
    );

    expect(result.breakdownLevel).toBeNull();
    expect(result.rows).toEqual([]);
    expect(result.parentScope).toEqual(store.scope);
  });

  test('fails closed when child scopes have mixed hierarchy levels', () => {
    const brand = brandSnapshot('brand_a', 'Brand A');
    const division = snapshot();

    division.scope = {
      level: 'division',
      networkId: 'network_a',
      brandId: 'brand_a',
      divisionId: 'division_a',
      displayName: 'Division A',
    };

    expect(() =>
      assembleProfitRoiBreakdown(
        snapshot().scope,
        snapshot().reportingPeriod,
        [
          {
            scope: brand.scope,
            displayName: 'Brand A',
            snapshot: brand,
          },
          {
            scope: division.scope,
            displayName: 'Division A',
            snapshot: division,
          },
        ]
      )
    ).toThrow('BREAKDOWN_SCOPE_LEVEL_MISMATCH');
  });

  test('fails closed when child scope and snapshot scope do not match', () => {
    const brandA = brandSnapshot('brand_a', 'Brand A');
    const brandB = brandSnapshot('brand_b', 'Brand B');

    expect(() =>
      assembleProfitRoiBreakdown(
        snapshot().scope,
        snapshot().reportingPeriod,
        [
          {
            scope: brandA.scope,
            displayName: 'Brand A',
            snapshot: brandB,
          },
        ]
      )
    ).toThrow('BREAKDOWN_SNAPSHOT_SCOPE_MISMATCH');
  });

  test('fails closed when child reporting period differs from the breakdown period', () => {
    const brand = brandSnapshot('brand_a', 'Brand A');

    brand.reportingPeriod = {
      ...brand.reportingPeriod,
      startAt: '2026-08-01T00:00:00.000Z',
      endAt: '2026-09-01T00:00:00.000Z',
    };

    expect(() =>
      assembleProfitRoiBreakdown(
        snapshot().scope,
        snapshot().reportingPeriod,
        [
          {
            scope: brand.scope,
            displayName: 'Brand A',
            snapshot: brand,
          },
        ]
      )
    ).toThrow('BREAKDOWN_REPORTING_PERIOD_MISMATCH');
  });
});

