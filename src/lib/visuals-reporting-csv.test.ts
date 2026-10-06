import type {
  VisualsReportingMetric,
  VisualsReportingResponse,
} from '@/lib/schemas/visuals-reporting';
import {
  projectVisualsReportingCsvRows,
  serializeVisualsReportingCsv,
} from './visuals-reporting-csv';

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

describe('Visuals & Reporting CSV export', () => {
  it('preserves governed unavailable evidence without manufacturing zero', () => {
    const rows = projectVisualsReportingCsvRows(reportFixture());

    const revenue = rows.find(
      (row) =>
        row.section === 'Commerce Outcomes' &&
        row.item === 'Associated Revenue',
    );

    expect(revenue).toBeDefined();
    expect(revenue?.value).toBeNull();
    expect(revenue?.status).toBe('REQUIRES_POS_DATA');
    expect(revenue?.evidenceCount).toBe(0);
  });

  it('serializes null as blank and safely escapes evidence detail', () => {
    const csv = serializeVisualsReportingCsv(reportFixture());

    const revenueLine = csv
      .split('\n')
      .find((line) => line.includes('"Associated Revenue"'));

    expect(revenueLine).toBeDefined();
    expect(revenueLine).toContain('"","RAND","REQUIRES_POS_DATA"');
    expect(revenueLine).toContain(
      '"POS data required, ""not estimated""."',
    );
  });

  it('serializes deterministically', () => {
    const report = reportFixture();

    expect(serializeVisualsReportingCsv(report)).toBe(
      serializeVisualsReportingCsv(report),
    );
  });
});
