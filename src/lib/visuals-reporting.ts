import type {
  OverviewMetric,
  OverviewMetricTrend,
  OverviewScope,
} from './schemas/overview-intelligence';
import type { ScanStatisticsResponse } from './schemas/scan-statistics';
import type { DecisionJourneyOutput } from './schemas/decision-journey';
import type { ProfitRoiSnapshot } from './schemas/profit-roi';
import type {
  VisualsReportingActivationRowSchema,
  VisualsReportingCommerceSchema,
  VisualsReportingMetric,
  VisualsReportingNetworkPerformanceSchema,
  VisualsReportingPodPerformanceSchema,
  VisualsReportingTrendPointSchema,
} from './schemas/visuals-reporting';
import type { z } from 'zod';

type NetworkPerformance = z.infer<
  typeof VisualsReportingNetworkPerformanceSchema
>;

type PodPerformance = z.infer<
  typeof VisualsReportingPodPerformanceSchema
>;

type ActivationRow = z.infer<
  typeof VisualsReportingActivationRowSchema
>;

type CommerceOutcomes = z.infer<
  typeof VisualsReportingCommerceSchema
>;

type TrendPoint = z.infer<
  typeof VisualsReportingTrendPointSchema
>;

function unavailableMetric(
  unit: VisualsReportingMetric['unit'],
  statusDetail: string,
): VisualsReportingMetric {
  return {
    status: 'UNAVAILABLE',
    value: null,
    unit,
    evidenceLevel: 'E0',
    evidenceCount: 0,
    statusDetail,
  };
}

export function projectOverviewMetric(
  metric: OverviewMetric,
): VisualsReportingMetric {
  return {
    status: metric.status,
    value: metric.value,
    unit: metric.unit,
    evidenceLevel: metric.evidenceLevel,
    evidenceCount: metric.evidenceCount,
    statusDetail: metric.statusDetail,
  };
}

export function projectRateMetric(
  status: 'MEASURED' | 'NO_ACTIVITY' | 'UNAVAILABLE',
  value: number | null,
  evidenceCount: number,
  statusDetail?: string,
): VisualsReportingMetric {
  return {
    status,
    value,
    unit: 'PERCENT',
    evidenceLevel: value === null ? 'E0' : 'E1',
    evidenceCount,
    statusDetail,
  };
}

function findTrend(
  trends: OverviewMetricTrend[],
  metricId:
    | 'qr_exposures'
    | 'qualifying_shopper_sessions'
    | 'ari_interactions'
    | 'decision_signals',
): TrendPoint[] {
  const trend = trends.find(item => item.metricId === metricId);

  if (!trend) {
    return [];
  }

  return trend.points.map(point => ({
    periodStart: point.periodStart,
    periodEnd: point.periodEnd,
    status: point.status,
    value: point.value,
    evidenceCount: point.evidenceCount,
  }));
}

export function projectNetworkPerformance(
  overview: {
    pointOfDecisionActivity: {
      qrExposures: OverviewMetric;
      qualifyingShopperSessions: OverviewMetric;
      ariInteractions: OverviewMetric;
      decisionSignals: OverviewMetric;
    };
    trends: OverviewMetricTrend[];
  },
  scans: ScanStatisticsResponse,
): NetworkPerformance {
  const rateEvidenceCount = Math.min(
    scans.qrExposures.value ?? 0,
    scans.qualifyingShopperSessions.value ?? 0,
  );

  return {
    qrExposures: projectOverviewMetric(
      overview.pointOfDecisionActivity.qrExposures,
    ),
    qualifyingShopperSessions: projectOverviewMetric(
      overview.pointOfDecisionActivity.qualifyingShopperSessions,
    ),
    exposureToSessionRatePercent: projectRateMetric(
      scans.exposureToSessionRatePercent.status,
      scans.exposureToSessionRatePercent.value,
      rateEvidenceCount,
      scans.exposureToSessionRatePercent.reason,
    ),
    ariInteractions: projectOverviewMetric(
      overview.pointOfDecisionActivity.ariInteractions,
    ),
    decisionSignals: projectOverviewMetric(
      overview.pointOfDecisionActivity.decisionSignals,
    ),
    qrExposureTrend: findTrend(overview.trends, 'qr_exposures'),
    qualifyingSessionTrend: findTrend(
      overview.trends,
      'qualifying_shopper_sessions',
    ),
    ariInteractionTrend: findTrend(overview.trends, 'ari_interactions'),
    decisionSignalTrend: findTrend(overview.trends, 'decision_signals'),
  };
}

export function projectActivationPerformance(
  scans: ScanStatisticsResponse,
): ActivationRow[] {
  return scans.activationPerformance
    .map(row => ({
      campaignId: row.campaignId,
      activationId: row.activationId,
      deploymentId: row.deploymentId,
      qrCodeId: row.qrCodeId,
      storeId: row.storeId,
      storeName: row.storeName,
      qrExposures: row.qrExposures,
      qualifyingShopperSessions: row.qualifyingShopperSessions,
      exposureToSessionRatePercent: row.exposureToSessionRatePercent,
      latestExposureAt: row.latestExposureAt,
    }))
    .sort((a, b) => {
      const storeCompare = a.storeName.localeCompare(b.storeName);

      if (storeCompare !== 0) {
        return storeCompare;
      }

      const campaignCompare = a.campaignId.localeCompare(b.campaignId);

      if (campaignCompare !== 0) {
        return campaignCompare;
      }

      return a.activationId.localeCompare(b.activationId);
    });
}

export function projectPodPerformance(
  journey: DecisionJourneyOutput | null,
): PodPerformance {
  if (!journey) {
    return {
      status: 'UNAVAILABLE',
      funnel: [],
      rejectionReasons: [],
      purchaseBarriers: [],
      alternativeProductMovement: [],
      statusDetail:
        'Verified Decision Journey evidence is unavailable for this reporting scope and period.',
    };
  }

  if (journey.metadata.dataStatus !== 'VERIFIED') {
    return {
      status: 'UNAVAILABLE',
      funnel: [],
      rejectionReasons: [],
      purchaseBarriers: [],
      alternativeProductMovement: [],
      statusDetail:
        'Only verified Decision Journey evidence may be used in production reporting.',
    };
  }

  const noActivity =
    journey.stats.totalUniqueSessions === 0 &&
    journey.funnel.every(stage => stage.uniqueSessions === 0);

  return {
    status: noActivity ? 'NO_ACTIVITY' : 'AVAILABLE',
    funnel: journey.funnel.map(stage => ({
      stage: stage.stage,
      uniqueSessions: stage.uniqueSessions,
      numerator: stage.numerator,
      denominator: stage.denominator,
      rate: stage.rate,
      denominatorName: stage.denominatorName,
    })),
    rejectionReasons: journey.rejectionBreakdown.map(item => ({
      label: item.reason,
      count: item.count,
      sharePercent: item.share,
    })),
    purchaseBarriers: journey.barrierBreakdown.map(item => ({
      label: item.barrier,
      count: item.count,
      sharePercent: item.share,
    })),
    alternativeProductMovement: journey.altProductBreakdown.map(item => ({
      gtin: item.gtin,
      uniqueSessions: item.uniqueSessions,
      movementRatePercent: item.rate,
      verifiedPurchaseCount: item.purchaseCount,
    })),
  };
}

function projectProfitRoiMetric(
  metric: ProfitRoiSnapshot['commerce']['verifiedPurchases'],
  unit: VisualsReportingMetric['unit'],
): VisualsReportingMetric {
  return {
    status: metric.status,
    value: metric.value,
    unit,
    evidenceLevel: metric.evidenceLevel,
    evidenceCount: metric.evidenceCount,
    statusDetail: metric.statusDetail,
  };
}

export function projectCommerceOutcomes(
  snapshot: ProfitRoiSnapshot | null,
): CommerceOutcomes {
  if (!snapshot) {
    const detail =
      'Commerce Evidence Unavailable — verified transaction reporting requires authoritative commerce evidence.';

    return {
      verifiedPurchases: unavailableMetric('COUNT', detail),
      associatedRevenue: unavailableMetric('RAND', detail),
      conversionRatePercent: unavailableMetric('PERCENT', detail),
      averageBasketValue: unavailableMetric('RAND', detail),
    };
  }

  return {
    verifiedPurchases: projectProfitRoiMetric(
      snapshot.commerce.verifiedPurchases,
      'COUNT',
    ),
    associatedRevenue: projectProfitRoiMetric(
      snapshot.commerce.attributedSales,
      'RAND',
    ),
    conversionRatePercent: projectProfitRoiMetric(
      snapshot.commerce.conversionRatePercentage,
      'PERCENT',
    ),
    averageBasketValue: projectProfitRoiMetric(
      snapshot.commerce.averageAttributedBasket,
      'RAND',
    ),
  };
}

export function scopeKey(scope: OverviewScope): string {
  return [
    scope.level,
    scope.networkId,
    scope.brandId,
    scope.divisionId,
    scope.regionId,
    scope.areaId,
    scope.storeId,
  ]
    .filter((value): value is string => Boolean(value))
    .join(':');
}
