import {
  assembleProfitRoiEvidence,
  type ProfitRoiEvidenceAssemblyInput,
} from './profit-roi-evidence-server';

const ts = (iso: string) => {
  const millis = new Date(iso).getTime();

  if (Number.isNaN(millis)) {
    throw new Error(`Invalid test timestamp: ${iso}`);
  }

  return {
    seconds: Math.floor(millis / 1000),
    nanoseconds: (millis % 1000) * 1_000_000,
  };
};

const periodStart = new Date('2026-09-01T00:00:00.000Z');
const periodEnd = new Date('2026-10-01T00:00:00.000Z');

function session(
  id: string,
  deploymentId = 'deployment-1'
) {
  return {
    id,
    data: {
      sessionId: id,
      retailerId: 'retailer-1',
      campaignId: 'campaign-1',
      activationId: 'activation-1',
      deploymentId,
      qrCodeId: 'qr-1',
      configurationVersion: 1,
      environment: 'PRODUCTION',
      startedAt: ts('2026-09-10T10:00:00.000Z'),
      lastInteractionAt: ts('2026-09-10T10:05:00.000Z'),
    },
  };
}

function transaction(
  id: string,
  sessionId: string | undefined,
  amount: number,
  currency = 'ZAR'
) {
  return {
    id,
    data: {
      transactionId: id,
      retailerId: 'retailer-1',
      amount,
      currency,
      timestamp: ts('2026-09-10T10:10:00.000Z'),
      ...(sessionId ? { sessionId } : {}),
      storeId: 'store-1',
      source: 'POS',
      dataStatus: 'VERIFIED',
      environment: 'PRODUCTION',
    },
  };
}

function baseInput(
  overrides: Partial<ProfitRoiEvidenceAssemblyInput> = {}
): ProfitRoiEvidenceAssemblyInput {
  return {
    retailerId: 'retailer-1',
    scope: {
      level: 'network',
      networkId: 'network-1',
    },
    reportingPeriod: {
      granularity: 'MONTHLY',
      startAt: periodStart,
      endAt: periodEnd,
      timezone: 'Africa/Johannesburg',
      financialYearStartMonth: 3,
    },
    authorizedDeploymentStoreIds: new Map([
      ['deployment-1', 'store-1'],
    ]),
    sessions: [],
    transactions: [],
    exposures: [],
    events: [],
    sourcesComplete: {
      sessions: true,
      transactions: true,
      exposures: true,
      events: true,
    },
    calculatedAt: new Date('2026-09-23T09:00:00.000Z'),
    ...overrides,
  };
}

describe('assembleProfitRoiEvidence', () => {
  it('measures deterministic E2 purchases and attributed sales', () => {
    const result = assembleProfitRoiEvidence(
      baseInput({
        sessions: [
          session('session-1'),
          session('session-2'),
          session('session-3'),
        ],
        transactions: [
          transaction('tx-1', 'session-1', 100),
          transaction('tx-2', 'session-2', 250),
          transaction('tx-3', 'session-3', 400),
        ],
      })
    );

    expect(result.commerce.verifiedPurchases.status).toBe(
      'MEASURED'
    );
    expect(result.commerce.verifiedPurchases.value).toBe(3);

    expect(result.commerce.attributedSales.status).toBe(
      'MEASURED'
    );
    expect(result.commerce.attributedSales.value).toBe(750);
    expect(result.commerce.attributedSales.currency).toBe('ZAR');

    expect(result.commerce.averageAttributedBasket.value).toBe(
      250
    );
  });

  it('does not convert E2 attributed sales into incrementality, profit or ROI', () => {
    const result = assembleProfitRoiEvidence(
      baseInput({
        sessions: [session('session-1')],
        transactions: [
          transaction('tx-1', 'session-1', 750),
        ],
      })
    );

    expect(result.commerce.attributedSales.value).toBe(750);

    expect(result.commerce.incrementalSales.value).toBeNull();
    expect(result.commerce.incrementalSales.reason).toBe(
      'COUNTERFACTUAL_UNAVAILABLE'
    );

    expect(
      result.profit.incrementalProfitContribution.value
    ).toBeNull();

    expect(result.reconciliation.totalFinancialBenefit.value)
      .toBeNull();

    expect(result.reconciliation.netFinancialBenefit.value)
      .toBeNull();

    expect(result.reconciliation.roiPercentage.value).toBeNull();
  });

  it('fails SaaS investment closed when no authoritative source exists', () => {
    const result = assembleProfitRoiEvidence(baseInput());

    expect(result.investment.saasInvestment.status).toBe(
      'UNAVAILABLE'
    );
    expect(result.investment.saasInvestment.value).toBeNull();
    expect(result.investment.saasInvestment.reason).toBe(
      'LICENCE_COST_UNAVAILABLE'
    );
  });

  it('fails Retail Media financial evidence closed', () => {
    const result = assembleProfitRoiEvidence(baseInput());

    expect(result.retailMedia.retailMediaRevenue.value).toBeNull();
    expect(result.retailMedia.retailMediaRevenue.reason).toBe(
      'RETAIL_MEDIA_REVENUE_UNAVAILABLE'
    );

    expect(result.retailMedia.rmnDeliveryCosts.value).toBeNull();
    expect(result.retailMedia.rmnDeliveryCosts.reason).toBe(
      'RMN_DELIVERY_COST_UNAVAILABLE'
    );

    expect(
      result.retailMedia.netRetailMediaContribution.value
    ).toBeNull();
  });

  it('reports Requires POS Data when no production transaction evidence exists', () => {
    const result = assembleProfitRoiEvidence(baseInput());

    expect(result.commerce.verifiedPurchases.status).toBe(
      'REQUIRES_POS_DATA'
    );
    expect(result.commerce.verifiedPurchases.value).toBeNull();

    expect(result.commerce.attributedSales.status).toBe(
      'REQUIRES_POS_DATA'
    );
    expect(result.commerce.attributedSales.value).toBeNull();
  });

  it('does not treat unattributed production transactions as E2', () => {
    const result = assembleProfitRoiEvidence(
      baseInput({
        transactions: [
          transaction('tx-1', undefined, 500),
        ],
      })
    );

    expect(result.commerce.verifiedPurchases.status).toBe(
      'INSUFFICIENT_EVIDENCE'
    );
    expect(result.commerce.verifiedPurchases.value).toBeNull();
    expect(result.commerce.verifiedPurchases.reason).toBe(
      'ATTRIBUTION_UNAVAILABLE'
    );

    expect(result.commerce.attributedSales.value).toBeNull();
  });

  it('rejects attribution outside the authorized Deployment scope', () => {
    const result = assembleProfitRoiEvidence(
      baseInput({
        sessions: [
          session('session-1', 'unauthorized-deployment'),
        ],
        transactions: [
          transaction('tx-1', 'session-1', 500),
        ],
      })
    );

    expect(result.commerce.verifiedPurchases.value).toBeNull();
    expect(result.commerce.verifiedPurchases.reason).toBe(
      'ATTRIBUTION_UNAVAILABLE'
    );
  });

  it('fails financial aggregation closed when non-ZAR production evidence is present', () => {
    const result = assembleProfitRoiEvidence(
      baseInput({
        sessions: [session('session-1')],
        transactions: [
          transaction('tx-1', 'session-1', 500, 'USD'),
        ],
      })
    );

    expect(result.commerce.attributedSales.value).toBeNull();
    expect(result.commerce.attributedSales.reason).toBe(
      'CURRENCY_MISMATCH'
    );
  });

  it('fails E2 metrics closed when source coverage is incomplete', () => {
    const result = assembleProfitRoiEvidence(
      baseInput({
        sessions: [session('session-1')],
        transactions: [
          transaction('tx-1', 'session-1', 500),
        ],
        sourcesComplete: {
          sessions: true,
          transactions: false,
          exposures: true,
          events: true,
        },
      })
    );

    expect(result.commerce.verifiedPurchases.value).toBeNull();
    expect(result.commerce.verifiedPurchases.reason).toBe(
      'INCOMPLETE_COVERAGE'
    );

    expect(result.commerce.attributedSales.value).toBeNull();
    expect(result.commerce.attributedSales.reason).toBe(
      'INCOMPLETE_COVERAGE'
    );
  });

  it('keeps conversion unavailable despite E2 attribution until full POS coverage is established', () => {
    const result = assembleProfitRoiEvidence(
      baseInput({
        sessions: [session('session-1')],
        transactions: [
          transaction('tx-1', 'session-1', 500),
        ],
      })
    );

    expect(result.commerce.conversionRatePercentage.value)
      .toBeNull();

    expect(result.commerce.conversionRatePercentage.reason)
      .toBe('INCOMPLETE_COVERAGE');
  });

  it('measures only in-period authorized POD evidence', () => {
    const result = assembleProfitRoiEvidence(
      baseInput({
        sessions: [session('session-1')],
        exposures: [
          {
            id: 'exposure-1',
            data: {
              retailerId: 'retailer-1',
              deploymentId: 'deployment-1',
              timestamp: ts(
                '2026-09-10T09:00:00.000Z'
              ),
            },
          },
          {
            id: 'exposure-2',
            data: {
              retailerId: 'retailer-1',
              deploymentId: 'other-deployment',
              timestamp: ts(
                '2026-09-10T09:00:00.000Z'
              ),
            },
          },
        ],
        events: [
          {
            id: 'event-1',
            data: {
              retailerId: 'retailer-1',
              sessionId: 'session-1',
              eventType: 'interaction_signal',
              timestamp: ts(
                '2026-09-10T10:02:00.000Z'
              ),
              metadata: {
                evidenceType: 'explicit',
                type: 'product_comparison',
              },
            },
          },
          {
            id: 'event-2',
            data: {
              retailerId: 'retailer-1',
              sessionId: 'session-1',
              eventType: 'interaction_signal',
              timestamp: ts(
                '2026-09-10T10:03:00.000Z'
              ),
              metadata: {
                evidenceType: 'inferred',
                type: 'product_consideration',
              },
            },
          },
        ],
      })
    );

    expect(result.funnel.qrExposures.value).toBe(1);
    expect(
      result.funnel.qualifyingShopperSessions.value
    ).toBe(1);
    expect(result.funnel.ariInteractions.value).toBe(2);
    expect(result.funnel.supportedDecisionSignals.value).toBe(1);
  });

  it('does not manufacture zero for incomplete POD evidence', () => {
    const result = assembleProfitRoiEvidence(
      baseInput({
        sourcesComplete: {
          sessions: true,
          transactions: true,
          exposures: false,
          events: false,
        },
      })
    );

    expect(result.funnel.qrExposures.value).toBeNull();
    expect(result.funnel.qrExposures.reason).toBe(
      'INCOMPLETE_COVERAGE'
    );

    expect(result.funnel.ariInteractions.value).toBeNull();
    expect(result.funnel.ariInteractions.reason).toBe(
      'INCOMPLETE_COVERAGE'
    );
  });

  it('preserves reporting-period authority in the snapshot', () => {
    const result = assembleProfitRoiEvidence(baseInput());

    expect(result.reportingPeriod.granularity).toBe('MONTHLY');
    expect(result.reportingPeriod.timezone).toBe(
      'Africa/Johannesburg'
    );
    expect(
      result.reportingPeriod.financialYearStartMonth
    ).toBe(3);
    expect(result.reportingPeriod.startAt).toBe(
      periodStart.toISOString()
    );
    expect(result.reportingPeriod.endAt).toBe(
      periodEnd.toISOString()
    );
  });
});