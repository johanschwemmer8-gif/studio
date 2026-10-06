import type {
  VisualsReportingMetric,
  VisualsReportingResponse,
} from '@/lib/schemas/visuals-reporting';
import { scopeKey } from '@/lib/visuals-reporting';

type CsvValue = string | number | null | undefined;

export type VisualsReportingCsvRow = {
  section: string;
  item: string;
  dimension: string;
  value: CsvValue;
  unit: string;
  status: string;
  evidenceLevel: string;
  evidenceCount: CsvValue;
  detail: string;
};

function metricRow(
  section: string,
  item: string,
  metric: VisualsReportingMetric,
  dimension = '',
): VisualsReportingCsvRow {
  return {
    section,
    item,
    dimension,
    value: metric.value,
    unit: metric.unit,
    status: metric.status,
    evidenceLevel: metric.evidenceLevel,
    evidenceCount: metric.evidenceCount,
    detail: metric.statusDetail ?? '',
  };
}

function escapeCsv(value: CsvValue): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function projectVisualsReportingCsvRows(
  report: VisualsReportingResponse,
): VisualsReportingCsvRow[] {
  const rows: VisualsReportingCsvRow[] = [
    {
      section: 'Report',
      item: 'Scope',
      dimension: report.scope.displayName ?? scopeKey(report.scope),
      value: scopeKey(report.scope),
      unit: '',
      status: report.evidenceStatus,
      evidenceLevel: '',
      evidenceCount: null,
      detail: '',
    },
    {
      section: 'Report',
      item: 'Reporting Period',
      dimension: report.reportingPeriod.granularity,
      value: `${report.reportingPeriod.startAt} / ${report.reportingPeriod.endAt}`,
      unit: '',
      status: report.evidenceStatus,
      evidenceLevel: '',
      evidenceCount: null,
      detail: report.reportingPeriod.timezone ?? '',
    },
    metricRow(
      'Network Performance',
      'QR Exposures',
      report.networkPerformance.qrExposures,
    ),
    metricRow(
      'Network Performance',
      'Qualifying Shopper Sessions',
      report.networkPerformance.qualifyingShopperSessions,
    ),
    metricRow(
      'Network Performance',
      'Exposure-to-Session Rate',
      report.networkPerformance.exposureToSessionRatePercent,
    ),
    metricRow(
      'Network Performance',
      'ARI Interactions',
      report.networkPerformance.ariInteractions,
    ),
    metricRow(
      'Network Performance',
      'Decision Signals',
      report.networkPerformance.decisionSignals,
    ),
  ];

  for (const organization of report.organizationalPerformance) {
    const dimension = `${organization.displayName} [${scopeKey(organization.scope)}]`;

    rows.push(
      metricRow(
        'Organisational Performance',
        'QR Exposures',
        organization.qrExposures,
        dimension,
      ),
      metricRow(
        'Organisational Performance',
        'Qualifying Shopper Sessions',
        organization.qualifyingShopperSessions,
        dimension,
      ),
      metricRow(
        'Organisational Performance',
        'Exposure-to-Session Rate',
        organization.exposureToSessionRatePercent,
        dimension,
      ),
      metricRow(
        'Organisational Performance',
        'ARI Interactions',
        organization.ariInteractions,
        dimension,
      ),
      metricRow(
        'Organisational Performance',
        'Decision Signals',
        organization.decisionSignals,
        dimension,
      ),
    );
  }

  for (const stage of report.pointOfDecisionPerformance.funnel) {
    rows.push({
      section: 'Point-of-Decision Funnel',
      item: stage.stage,
      dimension: stage.denominatorName,
      value: stage.rate,
      unit: 'PERCENT',
      status: report.pointOfDecisionPerformance.status,
      evidenceLevel: '',
      evidenceCount: stage.uniqueSessions,
      detail: `numerator=${stage.numerator}; denominator=${stage.denominator}`,
    });
  }

  for (const reason of report.pointOfDecisionPerformance.rejectionReasons) {
    rows.push({
      section: 'Rejection Reasons',
      item: reason.label,
      dimension: '',
      value: reason.sharePercent,
      unit: 'PERCENT',
      status: report.pointOfDecisionPerformance.status,
      evidenceLevel: '',
      evidenceCount: reason.count,
      detail: '',
    });
  }

  for (const barrier of report.pointOfDecisionPerformance.purchaseBarriers) {
    rows.push({
      section: 'Purchase Barriers',
      item: barrier.label,
      dimension: '',
      value: barrier.sharePercent,
      unit: 'PERCENT',
      status: report.pointOfDecisionPerformance.status,
      evidenceLevel: '',
      evidenceCount: barrier.count,
      detail: '',
    });
  }

  for (const movement of report.pointOfDecisionPerformance.alternativeProductMovement) {
    rows.push({
      section: 'Alternative Product Movement',
      item: movement.gtin,
      dimension: '',
      value: movement.movementRatePercent,
      unit: 'PERCENT',
      status: report.pointOfDecisionPerformance.status,
      evidenceLevel: '',
      evidenceCount: movement.uniqueSessions,
      detail: `verifiedPurchaseCount=${movement.verifiedPurchaseCount}`,
    });
  }

  for (const activation of report.campaignActivationPerformance) {
    rows.push({
      section: 'Campaign & Activation Performance',
      item: activation.activationId,
      dimension: activation.storeName,
      value: activation.exposureToSessionRatePercent,
      unit: 'PERCENT',
      status: activation.exposureToSessionRatePercent === null ? 'UNAVAILABLE' : 'MEASURED',
      evidenceLevel: '',
      evidenceCount: activation.qrExposures,
      detail: [
        `campaignId=${activation.campaignId}`,
        `deploymentId=${activation.deploymentId}`,
        `qrCodeId=${activation.qrCodeId}`,
        `storeId=${activation.storeId}`,
        `qualifyingShopperSessions=${activation.qualifyingShopperSessions}`,
        `latestExposureAt=${activation.latestExposureAt ?? ''}`,
      ].join('; '),
    });
  }

  rows.push(
    metricRow(
      'Commerce Outcomes',
      'Verified Purchases',
      report.commerceOutcomes.verifiedPurchases,
    ),
    metricRow(
      'Commerce Outcomes',
      'Associated Revenue',
      report.commerceOutcomes.associatedRevenue,
    ),
    metricRow(
      'Commerce Outcomes',
      'Conversion Rate',
      report.commerceOutcomes.conversionRatePercent,
    ),
    metricRow(
      'Commerce Outcomes',
      'Average Basket Value',
      report.commerceOutcomes.averageBasketValue,
    ),
  );

  return rows;
}

export function serializeVisualsReportingCsv(
  report: VisualsReportingResponse,
): string {
  const headers: (keyof VisualsReportingCsvRow)[] = [
    'section',
    'item',
    'dimension',
    'value',
    'unit',
    'status',
    'evidenceLevel',
    'evidenceCount',
    'detail',
  ];

  const rows = projectVisualsReportingCsvRows(report);

  return [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) =>
      headers.map((header) => escapeCsv(row[header])).join(','),
    ),
  ].join('\n');
}
