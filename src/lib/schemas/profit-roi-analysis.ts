import { z } from 'zod';

import {
  OverviewPeriodGranularitySchema,
  OverviewScopeLevelSchema,
  OverviewScopeSchema,
} from '@/lib/schemas/overview-intelligence';
import {
  ProfitRoiMetricSchema,
  ProfitRoiReportingPeriodSchema,
} from '@/lib/schemas/profit-roi';

/**
 * Authoritative Profit & ROI analysis contract.
 *
 * INVARIANTS:
 * - Analysis never weakens the evidence status of a financial metric.
 * - Missing or insufficient evidence is preserved as state, never converted to zero.
 * - Every historical point is independently evidence-gated.
 * - Every breakdown row is independently evidence-gated.
 * - Breakdown rows may only represent authorized immediate child scopes.
 * - Parent financial totals are not manufactured by summing child rows.
 * - Analysis remains ZAR-only through the canonical ProfitRoiMetric contract.
 */

export const ProfitRoiAnalysisMetricIdSchema = z.enum([
  'saasInvestment',
  'retailMediaRevenue',
  'licenceCostOffsetPercentage',
  'attributedSales',
  'incrementalSales',
  'incrementalProfitContribution',
  'netFinancialBenefit',
  'roiPercentage',
]);

export type ProfitRoiAnalysisMetricId = z.infer<
  typeof ProfitRoiAnalysisMetricIdSchema
>;

export const ProfitRoiAnalysisMetricsSchema = z.object({
  saasInvestment: ProfitRoiMetricSchema,
  retailMediaRevenue: ProfitRoiMetricSchema,
  licenceCostOffsetPercentage: ProfitRoiMetricSchema,
  attributedSales: ProfitRoiMetricSchema,
  incrementalSales: ProfitRoiMetricSchema,
  incrementalProfitContribution: ProfitRoiMetricSchema,
  netFinancialBenefit: ProfitRoiMetricSchema,
  roiPercentage: ProfitRoiMetricSchema,
});

export type ProfitRoiAnalysisMetrics = z.infer<
  typeof ProfitRoiAnalysisMetricsSchema
>;

export const ProfitRoiTrendPointSchema = z.object({
  reportingPeriod: ProfitRoiReportingPeriodSchema,
  metrics: ProfitRoiAnalysisMetricsSchema,
});

export type ProfitRoiTrendPoint = z.infer<
  typeof ProfitRoiTrendPointSchema
>;

export const ProfitRoiTrendSchema = z.object({
  granularity: OverviewPeriodGranularitySchema,
  points: z.array(ProfitRoiTrendPointSchema),
});

export type ProfitRoiTrend = z.infer<typeof ProfitRoiTrendSchema>;

export const ProfitRoiBreakdownRowSchema = z.object({
  scope: OverviewScopeSchema,
  displayName: z.string().min(1),
  metrics: ProfitRoiAnalysisMetricsSchema,
});

export type ProfitRoiBreakdownRow = z.infer<
  typeof ProfitRoiBreakdownRowSchema
>;

export const ProfitRoiBreakdownSchema = z.object({
  parentScope: OverviewScopeSchema,
  breakdownLevel: OverviewScopeLevelSchema.nullable(),
  reportingPeriod: ProfitRoiReportingPeriodSchema,
  rows: z.array(ProfitRoiBreakdownRowSchema),
});

export type ProfitRoiBreakdown = z.infer<
  typeof ProfitRoiBreakdownSchema
>;

export const ProfitRoiAnalysisSchema = z.object({
  scope: OverviewScopeSchema,
  reportingPeriod: ProfitRoiReportingPeriodSchema,
  calculatedAt: z.string().datetime(),
  trend: ProfitRoiTrendSchema,
  breakdown: ProfitRoiBreakdownSchema,
});

export type ProfitRoiAnalysis = z.infer<
  typeof ProfitRoiAnalysisSchema
>;
