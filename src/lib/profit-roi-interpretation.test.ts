import { interpretProfitRoiSnapshot } from '@/lib/profit-roi-interpretation';
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
      endAt: '2026-09-30T23:59:59.999Z',
      timezone: 'Africa/Johannesburg',
      financialYearStartMonth: 3,
    },
    calculatedAt: '2026-09-23T18:00:00.000Z',
    latestEvidenceAt: null,

    investment: {
      saasInvestment: metric({
        reason: 'LICENCE_COST_UNAVAILABLE',
        evidenceLevel: 'E0',
      }),
    },

    retailMedia: {
      retailMediaRevenue: metric({
        reason: 'RETAIL_MEDIA_REVENUE_UNAVAILABLE',
        evidenceLevel: 'E0',
      }),
      brandTurnover: metric(),
      attributedSales: metric({
        reason: 'ATTRIBUTION_UNAVAILABLE',
        evidenceLevel: 'E2',
      }),
      rmnDeliveryCosts: metric({
        reason: 'RMN_DELIVERY_COST_UNAVAILABLE',
        evidenceLevel: 'E0',
      }),
      netRetailMediaContribution: metric({
        reason: 'RMN_DELIVERY_COST_UNAVAILABLE',
        evidenceLevel: 'E0',
      }),
      licenceCostOffsetPercentage: percentMetric({
        reason: 'LICENCE_COST_UNAVAILABLE',
        evidenceLevel: 'E0',
      }),
      remainingLicenceCost: metric({
        reason: 'LICENCE_COST_UNAVAILABLE',
        evidenceLevel: 'E0',
      }),
      surplusAboveLicenceCost: metric({
        reason: 'LICENCE_COST_UNAVAILABLE',
        evidenceLevel: 'E0',
      }),
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
        reason: 'SOURCE_UNAVAILABLE',
        evidenceLevel: 'E4',
      }),
      netFinancialBenefit: metric({
        reason: 'SOURCE_UNAVAILABLE',
        evidenceLevel: 'E4',
      }),
      roiPercentage: percentMetric({
        reason: 'LICENCE_COST_UNAVAILABLE',
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

describe('interpretProfitRoiSnapshot', () => {
  test('never converts missing financial evidence into numerical claims', () => {
    const result = interpretProfitRoiSnapshot(snapshot());
    const text = [
      ...result.factualObservations,
      ...result.identifiedIndicators,
    ]
      .map(item => item.text)
      .join(' ');

    expect(text).not.toContain('R0');
    expect(text).not.toContain('0%');
    expect(result.identifiedIndicators).toHaveLength(0);
  });

  test('reports deterministic E2 attributed sales without calling it incremental', () => {
    const input = snapshot();

    input.commerce.verifiedPurchases = countMetric({
      status: 'MEASURED',
      value: 2,
      evidenceLevel: 'E2',
      evidenceCount: 2,
      reason: undefined,
      source: 'verified_transactions',
    });

    input.commerce.attributedSales = metric({
      status: 'MEASURED',
      value: 1250,
      evidenceLevel: 'E2',
      evidenceCount: 2,
      reason: undefined,
      source: 'deterministic_attribution',
    });

    const result = interpretProfitRoiSnapshot(input);
    const observation = result.factualObservations.find(
      item => item.statementId === 'attributed_sales'
    );

    expect(observation).toBeDefined();
    expect(observation?.evidenceLevel).toBe('E2');
    expect(observation?.text).toContain('attributed');
    expect(observation?.text).toContain('not incremental sales');
    expect(observation?.text).toContain(
      'not incremental sales or revenue generated by iNteract'
    );

    expect(
      result.identifiedIndicators.some(
        item => item.statementId === 'incremental_sales'
      )
    ).toBe(false);
  });

  test('does not claim uplift when E4 counterfactual evidence is unavailable', () => {
    const result = interpretProfitRoiSnapshot(snapshot());

    expect(
      result.identifiedIndicators.some(
        item =>
          item.statementId === 'incremental_sales' ||
          item.text.toLowerCase().includes('uplift of')
      )
    ).toBe(false);

    expect(
      result.suggestedActions.some(item =>
        item.text.toLowerCase().includes('counterfactual')
      )
    ).toBe(true);
  });

  test('does not claim profit without authoritative margin evidence', () => {
    const result = interpretProfitRoiSnapshot(snapshot());

    expect(
      result.identifiedIndicators.some(
        item => item.statementId === 'incremental_profit'
      )
    ).toBe(false);

    expect(
      result.suggestedActions.some(item =>
        item.text.toLowerCase().includes('margin evidence')
      )
    ).toBe(true);
  });

  test('describes measured retailer-owned RMN revenue without treating it as iNteract revenue', () => {
    const input = snapshot();

    input.retailMedia.retailMediaRevenue = metric({
      status: 'MEASURED',
      value: 5000,
      evidenceLevel: 'E1',
      evidenceCount: 1,
      reason: undefined,
      source: 'retail_media_revenue',
    });

    const result = interpretProfitRoiSnapshot(input);
    const observation = result.factualObservations.find(
      item => item.statementId === 'retail_media_revenue'
    );

    expect(observation).toBeDefined();
    expect(observation?.text).toContain('belongs to the retailer');
    expect(observation?.text).toContain('not iNteract revenue');
  });

  test('reports licence offset only when the authoritative offset metric is measured', () => {
    const input = snapshot();

    input.investment.saasInvestment = metric({
      status: 'MEASURED',
      value: 10000,
      evidenceLevel: 'E1',
      evidenceCount: 1,
      reason: undefined,
      source: 'billing',
    });

    input.retailMedia.retailMediaRevenue = metric({
      status: 'MEASURED',
      value: 2500,
      evidenceLevel: 'E1',
      evidenceCount: 1,
      reason: undefined,
      source: 'retail_media_revenue',
    });

    input.retailMedia.licenceCostOffsetPercentage = percentMetric({
      status: 'MEASURED',
      value: 25,
      evidenceLevel: 'E1',
      evidenceCount: 2,
      reason: undefined,
      source: 'authoritative_reconciliation',
    });

    const result = interpretProfitRoiSnapshot(input);
    const indicator = result.identifiedIndicators.find(
      item => item.statementId === 'licence_cost_offset'
    );

    expect(indicator).toBeDefined();
    expect(indicator?.text).toContain('25%');
  });

  test('permits incremental sales only when the snapshot exposes it as measured E4 evidence', () => {
    const input = snapshot();

    input.commerce.incrementalSales = metric({
      status: 'MEASURED',
      value: 900,
      evidenceLevel: 'E4',
      evidenceCount: 10,
      reason: undefined,
      source: 'approved_counterfactual',
    });

    const result = interpretProfitRoiSnapshot(input);
    const indicator = result.identifiedIndicators.find(
      item => item.statementId === 'incremental_sales'
    );

    expect(indicator).toBeDefined();
    expect(indicator?.evidenceLevel).toBe('E4');
    expect(indicator?.text).toContain('required E4 evidence');
  });

  test('permits profit only when the snapshot exposes profit as measured', () => {
    const input = snapshot();

    input.profit.marginBasis = {
      marginType: 'GROSS_MARGIN',
      marginRate: 0.3,
      marginSource: 'retailer_finance',
      scope: input.scope,
      effectiveFrom: '2026-09-01T00:00:00.000Z',
      effectiveTo: null,
      currency: 'ZAR',
    };

    input.profit.incrementalProfitContribution = metric({
      status: 'MEASURED',
      value: 270,
      evidenceLevel: 'E4',
      evidenceCount: 10,
      reason: undefined,
      source: 'authoritative_margin_reconciliation',
    });

    const result = interpretProfitRoiSnapshot(input);

    expect(
      result.identifiedIndicators.find(
        item => item.statementId === 'incremental_profit'
      )
    ).toBeDefined();
  });

  test('permits ROI only when the authoritative reconciliation metric is measured', () => {
    const input = snapshot();

    input.reconciliation.roiPercentage = percentMetric({
      status: 'MEASURED',
      value: -12.5,
      evidenceLevel: 'E4',
      evidenceCount: 10,
      reason: undefined,
      source: 'authoritative_reconciliation',
    });

    const result = interpretProfitRoiSnapshot(input);
    const indicator = result.identifiedIndicators.find(
      item => item.statementId === 'roi'
    );

    expect(indicator).toBeDefined();
    expect(indicator?.text).toContain('-12,5%');
  });

  test('returns NO_ACTIVITY for authoritative zero POD activity without measured financial evidence', () => {
    const result = interpretProfitRoiSnapshot(snapshot());

    expect(result.status).toBe('NO_ACTIVITY');
  });

  test('returns LIMITED_EVIDENCE when some evidence is measured but conclusions remain gated', () => {
    const input = snapshot();

    input.funnel.qrExposures = countMetric({
      status: 'MEASURED',
      value: 15,
      evidenceLevel: 'E0',
      evidenceCount: 15,
      reason: undefined,
      source: 'qr_exposures',
    });

    input.funnel.qualifyingShopperSessions = countMetric({
      status: 'MEASURED',
      value: 1,
      evidenceLevel: 'E0',
      evidenceCount: 1,
      reason: undefined,
      source: 'sessions',
    });

    const result = interpretProfitRoiSnapshot(input);

    expect(result.status).toBe('LIMITED_EVIDENCE');
    expect(
      result.factualObservations.some(
        item => item.statementId === 'pod_activity'
      )
    ).toBe(true);
  });

  test('deduplicates suggested actions for repeated evidence reasons', () => {
    const result = interpretProfitRoiSnapshot(snapshot());

    const posActions = result.suggestedActions.filter(item =>
      item.text.includes('POS transaction evidence')
    );

    expect(posActions).toHaveLength(1);
  });

  test('preserves evidence level instead of upgrading it during interpretation', () => {
    const input = snapshot();

    input.commerce.attributedSales = metric({
      status: 'MEASURED',
      value: 100,
      evidenceLevel: 'E2',
      evidenceCount: 1,
      reason: undefined,
      source: 'deterministic_attribution',
    });

    const result = interpretProfitRoiSnapshot(input);
    const observation = result.factualObservations.find(
      item => item.statementId === 'attributed_sales'
    );

    expect(observation?.evidenceLevel).toBe('E2');
  });
});
