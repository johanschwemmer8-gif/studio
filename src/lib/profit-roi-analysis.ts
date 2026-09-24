import {
  ProfitRoiAnalysisMetrics,
  ProfitRoiBreakdown,
  ProfitRoiBreakdownSchema,
  ProfitRoiTrend,
  ProfitRoiTrendSchema,
} from '@/lib/schemas/profit-roi-analysis';
import {
  ProfitRoiReportingPeriod,
  ProfitRoiSnapshot,
} from '@/lib/schemas/profit-roi';
import { OverviewScope } from '@/lib/schemas/overview-intelligence';

/**
 * Pure Profit & ROI analysis transformation.
 *
 * This layer does not calculate financial evidence.
 * It only projects already-authoritative ProfitRoiSnapshot metrics into
 * trend and organizational-breakdown structures.
 */

export function extractProfitRoiAnalysisMetrics(
  snapshot: ProfitRoiSnapshot
): ProfitRoiAnalysisMetrics {
  return {
    saasInvestment: snapshot.investment.saasInvestment,
    retailMediaRevenue: snapshot.retailMedia.retailMediaRevenue,
    licenceCostOffsetPercentage:
      snapshot.retailMedia.licenceCostOffsetPercentage,
    attributedSales: snapshot.commerce.attributedSales,
    incrementalSales: snapshot.commerce.incrementalSales,
    incrementalProfitContribution:
      snapshot.profit.incrementalProfitContribution,
    netFinancialBenefit:
      snapshot.reconciliation.netFinancialBenefit,
    roiPercentage: snapshot.reconciliation.roiPercentage,
  };
}

export function assembleProfitRoiTrend(
  granularity: ProfitRoiReportingPeriod['granularity'],
  snapshots: ProfitRoiSnapshot[]
): ProfitRoiTrend {
  if (
    snapshots.some(
      snapshot =>
        snapshot.reportingPeriod.granularity !== granularity
    )
  ) {
    throw new Error('TREND_GRANULARITY_MISMATCH');
  }

  return ProfitRoiTrendSchema.parse({
    granularity,
    points: snapshots.map(snapshot => ({
      reportingPeriod: snapshot.reportingPeriod,
      metrics: extractProfitRoiAnalysisMetrics(snapshot),
    })),
  });
}

export type ProfitRoiBreakdownSnapshot = {
  scope: OverviewScope;
  displayName: string;
  snapshot: ProfitRoiSnapshot;
};

function scopesMatch(
  left: OverviewScope,
  right: OverviewScope
): boolean {
  return (
    left.level === right.level &&
    left.networkId === right.networkId &&
    left.brandId === right.brandId &&
    left.divisionId === right.divisionId &&
    left.regionId === right.regionId &&
    left.areaId === right.areaId &&
    left.storeId === right.storeId
  );
}

function reportingPeriodsMatch(
  left: ProfitRoiReportingPeriod,
  right: ProfitRoiReportingPeriod
): boolean {
  return (
    left.granularity === right.granularity &&
    left.startAt === right.startAt &&
    left.endAt === right.endAt &&
    left.timezone === right.timezone &&
    left.financialYearStartMonth ===
      right.financialYearStartMonth
  );
}

export function assembleProfitRoiBreakdown(
  parentScope: OverviewScope,
  reportingPeriod: ProfitRoiReportingPeriod,
  children: ProfitRoiBreakdownSnapshot[]
): ProfitRoiBreakdown {
  const breakdownLevel =
    children.length > 0
      ? children[0].scope.level
      : null;

  if (
    children.some(
      child =>
        child.scope.level !== breakdownLevel
    )
  ) {
    throw new Error('BREAKDOWN_SCOPE_LEVEL_MISMATCH');
  }

  if (
    children.some(
      child => !scopesMatch(child.scope, child.snapshot.scope)
    )
  ) {
    throw new Error('BREAKDOWN_SNAPSHOT_SCOPE_MISMATCH');
  }

  if (
    children.some(
      child =>
        !reportingPeriodsMatch(
          reportingPeriod,
          child.snapshot.reportingPeriod
        )
    )
  ) {
    throw new Error('BREAKDOWN_REPORTING_PERIOD_MISMATCH');
  }

  return ProfitRoiBreakdownSchema.parse({
    parentScope,
    breakdownLevel,
    reportingPeriod,
    rows: children.map(child => ({
      scope: child.scope,
      displayName: child.displayName,
      metrics: extractProfitRoiAnalysisMetrics(child.snapshot),
    })),
  });
}
