import type {
  VisualsReportingMetric,
  VisualsReportingResponse,
} from '@/lib/schemas/visuals-reporting';
import { buildVisualsReportingBriefEvidence } from "./visuals-reporting-brief-evidence";

function metric(
  value: number | null,
  status: VisualsReportingMetric['status'] = 'MEASURED',
  statusDetail?: string,
): VisualsReportingMetric {
  return {
    status,
    value,
    unit: 'COUNT',
    evidenceLevel: 'E1',
    evidenceCount: value === null ? 0 : 1,
    statusDetail,
  };
}

function reportFixture(): VisualsReportingResponse {
  return {
    retailerId: 'retailer-1',
    scope: {
      level: 'brand',
      networkId: 'network-1',
      brandId: 'brand-1',
      displayName: 'Brand',
    },
    reportingPeriod: {
      granularity: 'MONTHLY',
      startAt: '2026-09-01T00:00:00.000Z',
      endAt: '2026-10-01T00:00:00.000Z',
      timezone: 'Africa/Johannesburg',
      financialYearStartMonth: 3,
    },
    evidenceStatus: 'AVAILABLE',
    networkPerformance: {
      qrExposures: metric(12),
      qualifyingShopperSessions: metric(7),
      exposureToSessionRatePercent: {
        ...metric(58.3),
        unit: 'PERCENT',
      },
      ariInteractions: metric(5),
      decisionSignals: metric(3),
      qrExposureTrend: [],
      qualifyingSessionTrend: [],
      ariInteractionTrend: [],
      decisionSignalTrend: [],
    },
    organizationalPerformance: [],
    pointOfDecisionPerformance: {
      status: 'NO_ACTIVITY',
      funnel: [],
      rejectionReasons: [],
      purchaseBarriers: [],
      alternativeProductMovement: [],
      statusDetail: 'No qualifying decision evidence.',
    },
    campaignActivationPerformance: [],
    commerceOutcomes: {
      verifiedPurchases: metric(2),
      associatedRevenue: {
        status: 'REQUIRES_POS_DATA',
        value: null,
        unit: 'RAND',
        evidenceLevel: 'E0',
        evidenceCount: 0,
        statusDetail: 'POS data required, "not estimated".',
      },
      conversionRatePercent: {
        ...metric(null, 'INSUFFICIENT_EVIDENCE'),
        unit: 'PERCENT',
      },
      averageBasketValue: {
        ...metric(null, 'REQUIRES_POS_DATA'),
        unit: 'RAND',
      },
    },
    latestEvidenceAt: '2026-09-20T10:00:00.000Z',
    calculatedAt: '2026-10-01T08:00:00.000Z',
  };
}

describe('buildVisualsReportingBriefEvidence', () => {
  it('admits measured reporting metrics and preserves exact scope and period', () => {
    const result = buildVisualsReportingBriefEvidence(
      reportFixture(),
    );

    expect(result.context).toEqual({
      scope: 'brand:network-1:brand-1',
      reportingPeriod: {
        startAt: '2026-09-01T00:00:00.000Z',
        endAt: '2026-10-01T00:00:00.000Z',
        granularity: 'MONTHLY',
        timezone: 'Africa/Johannesburg',
      },
    });

    expect(result.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'network:qrExposures',
          fact: expect.stringContaining('QR exposures = 12 COUNT'),
        }),
      ]),
    );

    expect(
      result.evidence.some(
        item =>
          item.ref === 'report:scope' ||
          item.ref === 'report:period',
      ),
    ).toBe(false);
  });

  it('admits a verified NO_ACTIVITY zero as authoritative evidence', () => {
    const report = reportFixture();

    report.networkPerformance.qrExposures = metric(
      0,
      'NO_ACTIVITY',
    );

    const result = buildVisualsReportingBriefEvidence(report);

    expect(result.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'network:qrExposures',
          fact: expect.stringContaining(
            'QR exposures = 0 COUNT; status NO_ACTIVITY',
          ),
        }),
      ]),
    );
  });

  it('keeps missing commerce evidence as a limitation and never manufactures zero', () => {
    const result = buildVisualsReportingBriefEvidence(
      reportFixture(),
    );

    expect(
      result.evidence.some(
        (item) => item.ref === 'commerce:associatedRevenue',
      ),
    ).toBe(false);

    expect(
      result.limitations.some(
        (item) =>
          item.includes('Associated revenue') &&
          item.includes('REQUIRES_POS_DATA'),
      ),
    ).toBe(true);

    expect(
      result.evidence.some(
        (item) =>
          item.ref === 'commerce:associatedRevenue' &&
          item.fact.includes('= 0'),
      ),
    ).toBe(false);
  });

  it('does not manufacture Point-of-Decision facts from an empty NO_ACTIVITY state', () => {
    const result = buildVisualsReportingBriefEvidence(
      reportFixture(),
    );

    expect(
      result.evidence.some(
        (item) => item.ref.startsWith('pod:'),
      ),
    ).toBe(false);

    expect(new Set(result.limitations).size).toBe(
      result.limitations.length,
    );
  });
});
