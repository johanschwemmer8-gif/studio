import { z } from 'zod';

import {
  OverviewEvidenceLevelSchema,
  OverviewMetricStatusSchema,
  OverviewPeriodGranularitySchema,
  OverviewScopeSchema,
} from './overview-intelligence';

/**
 * Canonical Visuals & Reporting contract.
 *
 * GOVERNING INVARIANTS
 * - Reporting contains authoritative retailer evidence only.
 * - Missing or insufficient evidence is a state, never an invented zero.
 * - Organisational scope is server-authorised.
 * - Reporting periods follow the retailer's authoritative reporting calendar.
 * - Commerce outcomes require authoritative commerce evidence.
 * - AI may interpret this reporting projection but may not create or alter it.
 * - Simulated evidence is not reportable production evidence.
 */

export const VisualsReportingMetricUnitSchema = z.enum([
  'COUNT',
  'PERCENT',
  'RAND',
]);

/**
 * Reporting must preserve the evidence states of every authoritative
 * source it projects. Profit & ROI can legitimately report
 * LIMITED_EVIDENCE in addition to the canonical Overview metric states.
 */
export const VisualsReportingMetricStatusSchema = z.enum([
  'MEASURED',
  'NO_ACTIVITY',
  'REQUIRES_POS_DATA',
  'INSUFFICIENT_EVIDENCE',
  'LIMITED_EVIDENCE',
  'UNAVAILABLE',
]);

export const VisualsReportingMetricSchema = z.object({
  status: VisualsReportingMetricStatusSchema,
  value: z.number().finite().nullable(),
  unit: VisualsReportingMetricUnitSchema,
  evidenceLevel: OverviewEvidenceLevelSchema,
  evidenceCount: z.number().int().nonnegative(),
  statusDetail: z.string().min(1).optional(),
});

export type VisualsReportingMetric = z.infer<
  typeof VisualsReportingMetricSchema
>;

export const VisualsReportingPeriodSchema = z.object({
  granularity: OverviewPeriodGranularitySchema,
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().min(1).nullable(),
  financialYearStartMonth: z.number().int().min(1).max(12).nullable(),
});

export const VisualsReportingRequestSchema = z.object({
  scope: OverviewScopeSchema,
  granularity: OverviewPeriodGranularitySchema,
});

export type VisualsReportingRequest = z.infer<
  typeof VisualsReportingRequestSchema
>;

export const VisualsReportingTrendPointSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  status: OverviewMetricStatusSchema,
  value: z.number().finite().nullable(),
  evidenceCount: z.number().int().nonnegative(),
});

export type VisualsReportingTrendPoint = z.infer<typeof VisualsReportingTrendPointSchema>;

export const VisualsReportingNetworkPerformanceSchema = z.object({
  qrExposures: VisualsReportingMetricSchema,
  qualifyingShopperSessions: VisualsReportingMetricSchema,
  exposureToSessionRatePercent: VisualsReportingMetricSchema,
  ariInteractions: VisualsReportingMetricSchema,
  decisionSignals: VisualsReportingMetricSchema,
  qrExposureTrend: z.array(VisualsReportingTrendPointSchema),
  qualifyingSessionTrend: z.array(VisualsReportingTrendPointSchema),
  ariInteractionTrend: z.array(VisualsReportingTrendPointSchema),
  decisionSignalTrend: z.array(VisualsReportingTrendPointSchema),
});

export const VisualsReportingOrganizationRowSchema = z.object({
  scope: OverviewScopeSchema,
  displayName: z.string().min(1),
  qrExposures: VisualsReportingMetricSchema,
  qualifyingShopperSessions: VisualsReportingMetricSchema,
  exposureToSessionRatePercent: VisualsReportingMetricSchema,
  ariInteractions: VisualsReportingMetricSchema,
  decisionSignals: VisualsReportingMetricSchema,
});
export type VisualsReportingOrganizationRow = z.infer<typeof VisualsReportingOrganizationRowSchema>;


export const VisualsReportingPodStageSchema = z.object({
  stage: z.enum([
    'EXPOSURE',
    'INTEREST',
    'CONSIDERATION',
    'REJECTION',
    'BASKET',
    'PURCHASE',
  ]),
  uniqueSessions: z.number().int().nonnegative(),
  numerator: z.number().int().nonnegative(),
  denominator: z.number().int().nonnegative(),
  rate: z.number().nonnegative(),
  denominatorName: z.string().min(1),
});

export const VisualsReportingReasonRowSchema = z.object({
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
  sharePercent: z.number().nonnegative(),
});

export const VisualsReportingAlternativeProductRowSchema = z.object({
  gtin: z.string().min(1),
  uniqueSessions: z.number().int().nonnegative(),
  movementRatePercent: z.number().nonnegative(),
  verifiedPurchaseCount: z.number().int().nonnegative(),
});

export const VisualsReportingPodPerformanceSchema = z.object({
  status: z.enum(['AVAILABLE', 'NO_ACTIVITY', 'UNAVAILABLE']),
  funnel: z.array(VisualsReportingPodStageSchema),
  rejectionReasons: z.array(VisualsReportingReasonRowSchema),
  purchaseBarriers: z.array(VisualsReportingReasonRowSchema),
  alternativeProductMovement: z.array(
    VisualsReportingAlternativeProductRowSchema,
  ),
  statusDetail: z.string().min(1).optional(),
});

export const VisualsReportingActivationRowSchema = z.object({
  campaignId: z.string().min(1),
  activationId: z.string().min(1),
  deploymentId: z.string().min(1),
  qrCodeId: z.string().min(1),
  storeId: z.string().min(1),
  storeName: z.string().min(1),
  qrExposures: z.number().int().nonnegative(),
  qualifyingShopperSessions: z.number().int().nonnegative(),
  exposureToSessionRatePercent: z.number().nonnegative().nullable(),
  latestExposureAt: z.string().datetime().nullable(),
});

export const VisualsReportingCommerceSchema = z.object({
  verifiedPurchases: VisualsReportingMetricSchema,
  associatedRevenue: VisualsReportingMetricSchema,
  conversionRatePercent: VisualsReportingMetricSchema,
  averageBasketValue: VisualsReportingMetricSchema,
});

export const VisualsReportingEvidenceStatusSchema = z.enum([
  'AVAILABLE',
  'LIMITED_EVIDENCE',
  'NO_ACTIVITY',
  'UNAVAILABLE',
]);

export const VisualsReportingResponseSchema = z.object({
  retailerId: z.string().min(1),

  scope: OverviewScopeSchema,

  reportingPeriod: VisualsReportingPeriodSchema,

  evidenceStatus: VisualsReportingEvidenceStatusSchema,

  networkPerformance: VisualsReportingNetworkPerformanceSchema,

  organizationalPerformance: z.array(
    VisualsReportingOrganizationRowSchema,
  ),

  pointOfDecisionPerformance: VisualsReportingPodPerformanceSchema,

  campaignActivationPerformance: z.array(
    VisualsReportingActivationRowSchema,
  ),

  commerceOutcomes: VisualsReportingCommerceSchema,

  latestEvidenceAt: z.string().datetime().nullable(),
  calculatedAt: z.string().datetime(),
});

export type VisualsReportingResponse = z.infer<
  typeof VisualsReportingResponseSchema
>;

/**
 * Visuals & Reporting navigation contract.
 *
 * Brand Portfolio is the reporting isolation boundary.
 * Reporting levels are presentation/navigation choices inside one Brand.
 * Every organisational-unit option carries its complete canonical scope so
 * the browser never reconstructs hierarchy ancestry.
 */
export const VisualsReportingNavigationItemSchema = z.object({
  scope: OverviewScopeSchema,
  displayName: z.string().min(1),
});

export const VisualsReportingNavigationSchema = z.object({
  brandPortfolio: z.array(
    VisualsReportingNavigationItemSchema,
  ).min(1),

  selectedBrand: VisualsReportingNavigationItemSchema,

  divisions: z.array(
    VisualsReportingNavigationItemSchema,
  ),

  regions: z.array(
    VisualsReportingNavigationItemSchema,
  ),

  areas: z.array(
    VisualsReportingNavigationItemSchema,
  ),

  stores: z.array(
    VisualsReportingNavigationItemSchema,
  ),
});

export type VisualsReportingNavigation = z.infer<
  typeof VisualsReportingNavigationSchema
>;
