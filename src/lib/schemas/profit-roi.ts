import { z } from 'zod';

import {
  OverviewEvidenceLevelSchema,
  OverviewPeriodGranularitySchema,
  OverviewScopeSchema,
} from '@/lib/schemas/overview-intelligence';

/**
 * Canonical Profit & ROI financial intelligence contract.
 *
 * INVARIANTS:
 * - Production Profit & ROI is live-data-only.
 * - Missing or insufficient evidence is a state, never an invented zero.
 * - Attributed Sales is not automatically Incremental Sales.
 * - Incremental Sales is not automatically Profit.
 * - Retail Media Revenue belongs to the retailer, not iNteract.
 * - Brand Turnover is not Retail Media Revenue.
 * - Gross Retail Media Revenue may support Licence Cost Offset.
 * - Final ROI uses Net Retail Media Contribution, not gross revenue.
 * - iNteract SaaS Investment must not be double-counted as an RMN delivery cost.
 * - Initial production financial reconciliation is ZAR-only.
 */

export const ProfitRoiCurrencySchema = z.literal('ZAR');

export const ProfitRoiMetricStatusSchema = z.enum([
  'MEASURED',
  'NO_ACTIVITY',
  'REQUIRES_POS_DATA',
  'INSUFFICIENT_EVIDENCE',
  'UNAVAILABLE',
  'LIMITED_EVIDENCE',
]);

export type ProfitRoiMetricStatus = z.infer<
  typeof ProfitRoiMetricStatusSchema
>;

export const ProfitRoiEvidenceReasonSchema = z.enum([
  'POS_DATA_MISSING',
  'ATTRIBUTION_UNAVAILABLE',
  'BASELINE_UNAVAILABLE',
  'COUNTERFACTUAL_UNAVAILABLE',
  'MARGIN_DATA_MISSING',
  'LICENCE_COST_UNAVAILABLE',
  'RETAIL_MEDIA_REVENUE_UNAVAILABLE',
  'RMN_DELIVERY_COST_UNAVAILABLE',
  'INCOMPLETE_COVERAGE',
  'INSUFFICIENT_SAMPLE',
  'SCOPE_MISMATCH',
  'PERIOD_MISMATCH',
  'CURRENCY_MISMATCH',
  'SOURCE_UNAVAILABLE',
]);

export type ProfitRoiEvidenceReason = z.infer<
  typeof ProfitRoiEvidenceReasonSchema
>;

export const ProfitRoiMetricUnitSchema = z.enum([
  'COUNT',
  'PERCENT',
  'RAND',
]);

export type ProfitRoiMetricUnit = z.infer<
  typeof ProfitRoiMetricUnitSchema
>;

export const ProfitRoiMetricSchema = z.object({
  status: ProfitRoiMetricStatusSchema,
  value: z.number().finite().nullable(),
  unit: ProfitRoiMetricUnitSchema,
  currency: ProfitRoiCurrencySchema.nullable(),
  evidenceLevel: OverviewEvidenceLevelSchema,
  evidenceCount: z.number().int().nonnegative(),
  reason: ProfitRoiEvidenceReasonSchema.optional(),
  statusDetail: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
});

export type ProfitRoiMetric = z.infer<typeof ProfitRoiMetricSchema>;

export const ProfitRoiReportingPeriodSchema = z.object({
  granularity: OverviewPeriodGranularitySchema,
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().min(1),
  financialYearStartMonth: z.number().int().min(1).max(12),
});

export type ProfitRoiReportingPeriod = z.infer<
  typeof ProfitRoiReportingPeriodSchema
>;

export const ProfitRoiMarginBasisSchema = z.object({
  marginType: z.string().min(1),
  marginRate: z.number().finite().min(0).max(1),
  marginSource: z.string().min(1),
  scope: OverviewScopeSchema,
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().nullable(),
  currency: ProfitRoiCurrencySchema.nullable(),
});

export type ProfitRoiMarginBasis = z.infer<
  typeof ProfitRoiMarginBasisSchema
>;

export const ProfitRoiInvestmentSchema = z.object({
  saasInvestment: ProfitRoiMetricSchema,
});

export const ProfitRoiRetailMediaSchema = z.object({
  retailMediaRevenue: ProfitRoiMetricSchema,
  brandTurnover: ProfitRoiMetricSchema,
  attributedSales: ProfitRoiMetricSchema,
  rmnDeliveryCosts: ProfitRoiMetricSchema,
  netRetailMediaContribution: ProfitRoiMetricSchema,
  licenceCostOffsetPercentage: ProfitRoiMetricSchema,
  remainingLicenceCost: ProfitRoiMetricSchema,
  surplusAboveLicenceCost: ProfitRoiMetricSchema,
});

export const ProfitRoiCommerceSchema = z.object({
  verifiedPurchases: ProfitRoiMetricSchema,
  attributedSales: ProfitRoiMetricSchema,
  conversionRatePercentage: ProfitRoiMetricSchema,
  averageAttributedBasket: ProfitRoiMetricSchema,
  basketIncreaseRand: ProfitRoiMetricSchema,
  basketIncreasePercentage: ProfitRoiMetricSchema,
  incrementalSales: ProfitRoiMetricSchema,
  salesUpliftPercentage: ProfitRoiMetricSchema,
});

export const ProfitRoiProfitSchema = z.object({
  marginBasis: ProfitRoiMarginBasisSchema.nullable(),
  incrementalProfitContribution: ProfitRoiMetricSchema,
});

export const ProfitRoiReconciliationSchema = z.object({
  totalFinancialBenefit: ProfitRoiMetricSchema,
  netFinancialBenefit: ProfitRoiMetricSchema,
  roiPercentage: ProfitRoiMetricSchema,
});

export const ProfitRoiFunnelSchema = z.object({
  qrExposures: ProfitRoiMetricSchema,
  qualifyingShopperSessions: ProfitRoiMetricSchema,
  ariInteractions: ProfitRoiMetricSchema,
  supportedDecisionSignals: ProfitRoiMetricSchema,
  verifiedPurchases: ProfitRoiMetricSchema,
  attributedSales: ProfitRoiMetricSchema,
});

export const ProfitRoiSnapshotSchema = z.object({
  scope: OverviewScopeSchema,
  reportingPeriod: ProfitRoiReportingPeriodSchema,
  calculatedAt: z.string().datetime(),
  latestEvidenceAt: z.string().datetime().nullable(),

  investment: ProfitRoiInvestmentSchema,
  retailMedia: ProfitRoiRetailMediaSchema,
  commerce: ProfitRoiCommerceSchema,
  profit: ProfitRoiProfitSchema,
  reconciliation: ProfitRoiReconciliationSchema,
  funnel: ProfitRoiFunnelSchema,
});

export type ProfitRoiSnapshot = z.infer<typeof ProfitRoiSnapshotSchema>;
export type ProfitRoiInvestment = z.infer<typeof ProfitRoiInvestmentSchema>;
export type ProfitRoiRetailMedia = z.infer<typeof ProfitRoiRetailMediaSchema>;
export type ProfitRoiCommerce = z.infer<typeof ProfitRoiCommerceSchema>;
export type ProfitRoiProfit = z.infer<typeof ProfitRoiProfitSchema>;
export type ProfitRoiReconciliation = z.infer<
  typeof ProfitRoiReconciliationSchema
>;
export type ProfitRoiFunnel = z.infer<typeof ProfitRoiFunnelSchema>;