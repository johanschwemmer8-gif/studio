import type {
  OverviewMetric,
  OverviewMetricTrend,
  OverviewScope,
} from './schemas/overview-intelligence';
import type { ScanStatisticsResponse } from './schemas/scan-statistics';
import type { DecisionJourneyOutput } from './schemas/decision-journey';
import type { ProfitRoiSnapshot } from './schemas/profit-roi';

import {
  projectActivationPerformance,
  projectCommerceOutcomes,
  projectOverviewMetric,
  projectPodPerformance,
  scopeKey,
} from './visuals-reporting';

function overviewMetric(
  overrides: Partial<OverviewMetric> = {},
): OverviewMetric {
  return {
    metricId: 'qr_exposures',
    status: 'MEASURED',
    value: 12,
    unit: 'COUNT',
    evidenceLevel: 'E1',
    evidenceCount: 12,
    ...overrides,
  };
}

function scanStatistics(): ScanStatisticsResponse {
  return {
    retailerId: 'retailer-1',
    scope: {
      level: 'network',
      networkId: 'network-1',
    },
    evidenceWindow: {
      startAt: '2026-09-01T00:00:00.000Z',
      endAt: '2026-09-30T23:59:59.999Z',
    },
    qrExposures: {
      status: 'MEASURED',
      value: 30,
    },
    qualifyingShopperSessions: {
      status: 'MEASURED',
      value: 10,
    },
    exposureToSessionRatePercent: {
      status: 'MEASURED',
      value: 33.33,
    },
    activationPerformance: [
      {
        activationId: 'activation-z',
        qrCodeId: 'qr-z',
        campaignId: 'campaign-2',
        deploymentId: 'deployment-z',
        storeId: 'store-2',
        storeName: 'Zulu Store',
        qrExposures: 10,
        qualifyingShopperSessions: 2,
        exposureToSessionRatePercent: 20,
        latestExposureAt: '2026-09-20T10:00:00.000Z',
      },
      {
        activationId: 'activation-b',
        qrCodeId: 'qr-b',
        campaignId: 'campaign-2',
        deploymentId: 'deployment-b',
        storeId: 'store-1',
        storeName: 'Alpha Store',
        qrExposures: 5,
        qualifyingShopperSessions: 2,
        exposureToSessionRatePercent: 40,
        latestExposureAt: '2026-09-19T10:00:00.000Z',
      },
      {
        activationId: 'activation-a',
        qrCodeId: 'qr-a',
        campaignId: 'campaign-1',
        deploymentId: 'deployment-a',
        storeId: 'store-1',
        storeName: 'Alpha Store',
        qrExposures: 15,
        qualifyingShopperSessions: 6,
        exposureToSessionRatePercent: 40,
        latestExposureAt: '2026-09-21T10:00:00.000Z',
      },
    ],
    latestEvidenceAt: '2026-09-21T10:00:00.000Z',
    calculatedAt: '2026-10-01T08:00:00.000Z',
  };
}

function decisionJourney(
  dataStatus: 'VERIFIED' | 'SIMULATED',
): DecisionJourneyOutput {
  return {
    retailerId: 'retailer-1',
    timeWindow: {
      start: '2026-09-01T00:00:00.000Z',
      end: '2026-09-30T23:59:59.999Z',
    },
    summary: 'Deterministic journey summary.',
    funnel: [
      {
        stage: 'EXPOSURE',
        uniqueSessions: 10,
        numerator: 10,
        denominator: 10,
        rate: 100,
        denominatorName: 'Total Unique Exposed Sessions',
      },
      {
        stage: 'CONSIDERATION',
        uniqueSessions: 4,
        numerator: 4,
        denominator: 10,
        rate: 40,
        denominatorName: 'Total Unique Exposed Sessions',
      },
    ],
    rejectionBreakdown: [
      {
        reason: 'Price',
        count: 2,
        share: 50,
      },
    ],
    barrierBreakdown: [
      {
        barrier: 'Size',
        count: 1,
        share: 10,
      },
    ],
    altProductBreakdown: [
      {
        gtin: '06001234567890',
        uniqueSessions: 2,
        rate: 20,
        purchaseCount: 1,
      },
    ],
    stats: {
      totalUniqueSessions: 10,
      alternativeProductMovements: 2,
      recommendationToPurchaseCount: 1,
      leakagePoints: {
        VIEW_ONLY: 3,
      },
      rejectionsWithReason: 2,
      rejectionsWithoutReason: 0,
    },
    metadata: {
      aggregationVersion: '1.4.0',
      dataStatus,
      evidenceStrength: 'MODERATE',
      methodology: 'Deterministic test evidence.',
    },
  };
}

function profitRoiSnapshot(
  status:
    | 'MEASURED'
    | 'NO_ACTIVITY'
    | 'REQUIRES_POS_DATA'
    | 'INSUFFICIENT_EVIDENCE'
    | 'LIMITED_EVIDENCE'
    | 'UNAVAILABLE' = 'MEASURED',
): ProfitRoiSnapshot {
  const metric = (
    value: number | null,
    unit: 'COUNT' | 'PERCENT' | 'RAND',
  ): ProfitRoiSnapshot['commerce']['verifiedPurchases'] => ({
    status,
    value,
    unit,
    currency: unit === 'RAND' ? 'ZAR' : null,
    evidenceLevel: value === null ? 'E0' : 'E2',
    evidenceCount: value === null ? 0 : 4,
  });

  return {
    scope: {
      level: 'network',
      networkId: 'network-1',
    },
    reportingPeriod: {
      granularity: 'MONTHLY',
      startAt: '2026-09-01T00:00:00.000Z',
      endAt: '2026-09-30T23:59:59.999Z',
      timezone: 'Africa/Johannesburg',
      financialYearStartMonth: 7,
    },
    calculatedAt: '2026-10-01T08:00:00.000Z',
    latestEvidenceAt: '2026-09-30T17:00:00.000Z',
    investment: {
      saasInvestment: metric(null, 'RAND'),
    },
    retailMedia: {
      retailMediaRevenue: metric(null, 'RAND'),
      brandTurnover: metric(null, 'RAND'),
      attributedSales: metric(null, 'RAND'),
      rmnDeliveryCosts: metric(null, 'RAND'),
      netRetailMediaContribution: metric(null, 'RAND'),
      licenceCostOffsetPercentage: metric(null, 'PERCENT'),
      remainingLicenceCost: metric(null, 'RAND'),
      surplusAboveLicenceCost: metric(null, 'RAND'),
    },
    commerce: {
      verifiedPurchases: metric(4, 'COUNT'),
      attributedSales: metric(1250, 'RAND'),
      conversionRatePercentage: metric(20, 'PERCENT'),
      averageAttributedBasket: metric(312.5, 'RAND'),
      basketIncreaseRand: metric(null, 'RAND'),
      basketIncreasePercentage: metric(null, 'PERCENT'),
      incrementalSales: metric(null, 'RAND'),
      salesUpliftPercentage: metric(null, 'PERCENT'),
    },
    profit: {
      marginBasis: null,
      incrementalProfitContribution: metric(null, 'RAND'),
    },
    reconciliation: {
      totalFinancialBenefit: metric(null, 'RAND'),
      netFinancialBenefit: metric(null, 'RAND'),
      roiPercentage: metric(null, 'PERCENT'),
    },
    funnel: {
      qrExposures: metric(20, 'COUNT'),
      qualifyingShopperSessions: metric(10, 'COUNT'),
      ariInteractions: metric(5, 'COUNT'),
      supportedDecisionSignals: metric(3, 'COUNT'),
      verifiedPurchases: metric(4, 'COUNT'),
      attributedSales: metric(1250, 'RAND'),
    },
  };
}

describe('Visuals & Reporting deterministic projection', () => {
  it('preserves authoritative Overview evidence without inventing values', () => {
    const source = overviewMetric({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      evidenceLevel: 'E0',
      evidenceCount: 0,
      statusDetail: 'Insufficient authoritative evidence.',
    });

    expect(projectOverviewMetric(source)).toEqual({
      status: 'INSUFFICIENT_EVIDENCE',
      value: null,
      unit: 'COUNT',
      evidenceLevel: 'E0',
      evidenceCount: 0,
      statusDetail: 'Insufficient authoritative evidence.',
    });
  });

  it('represents missing commerce evidence as unavailable, never zero', () => {
    const result = projectCommerceOutcomes(null);

    expect(result.verifiedPurchases.status).toBe('UNAVAILABLE');
    expect(result.verifiedPurchases.value).toBeNull();

    expect(result.associatedRevenue.status).toBe('UNAVAILABLE');
    expect(result.associatedRevenue.value).toBeNull();

    expect(result.conversionRatePercent.value).toBeNull();
    expect(result.averageBasketValue.value).toBeNull();
  });

  it('preserves LIMITED_EVIDENCE from authoritative commerce evidence', () => {
    const result = projectCommerceOutcomes(
      profitRoiSnapshot('LIMITED_EVIDENCE'),
    );

    expect(result.verifiedPurchases.status).toBe('LIMITED_EVIDENCE');
    expect(result.verifiedPurchases.value).toBe(4);

    expect(result.associatedRevenue.status).toBe('LIMITED_EVIDENCE');
    expect(result.associatedRevenue.value).toBe(1250);
  });

  it('rejects simulated Decision Journey evidence from production reporting', () => {
    const result = projectPodPerformance(decisionJourney('SIMULATED'));

    expect(result.status).toBe('UNAVAILABLE');
    expect(result.funnel).toEqual([]);
    expect(result.rejectionReasons).toEqual([]);
    expect(result.purchaseBarriers).toEqual([]);
    expect(result.alternativeProductMovement).toEqual([]);
    expect(result.statusDetail).toContain('verified');
  });

  it('projects verified Decision Journey evidence', () => {
    const result = projectPodPerformance(decisionJourney('VERIFIED'));

    expect(result.status).toBe('AVAILABLE');
    expect(result.funnel).toHaveLength(2);

    expect(result.rejectionReasons).toEqual([
      {
        label: 'Price',
        count: 2,
        sharePercent: 50,
      },
    ]);

    expect(result.purchaseBarriers).toEqual([
      {
        label: 'Size',
        count: 1,
        sharePercent: 10,
      },
    ]);

    expect(result.alternativeProductMovement).toEqual([
      {
        gtin: '06001234567890',
        uniqueSessions: 2,
        movementRatePercent: 20,
        verifiedPurchaseCount: 1,
      },
    ]);
  });

  it('orders activation reporting deterministically', () => {
    const result = projectActivationPerformance(scanStatistics());

    expect(
      result.map(row => [
        row.storeName,
        row.campaignId,
        row.activationId,
      ]),
    ).toEqual([
      ['Alpha Store', 'campaign-1', 'activation-a'],
      ['Alpha Store', 'campaign-2', 'activation-b'],
      ['Zulu Store', 'campaign-2', 'activation-z'],
    ]);
  });

  it('creates deterministic hierarchical scope keys', () => {
    const scope: OverviewScope = {
      level: 'store',
      networkId: 'network-1',
      brandId: 'brand-1',
      divisionId: 'division-1',
      regionId: 'region-1',
      areaId: 'area-1',
      storeId: 'store-1',
    };

    expect(scopeKey(scope)).toBe(
      'store:network-1:brand-1:division-1:region-1:area-1:store-1',
    );
  });

  it('does not mutate source activation evidence', () => {
    const source = scanStatistics();
    const before = JSON.stringify(source);

    projectActivationPerformance(source);

    expect(JSON.stringify(source)).toBe(before);
  });
});
