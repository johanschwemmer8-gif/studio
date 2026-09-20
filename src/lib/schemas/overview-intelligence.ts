import { z } from 'zod';

/**
 * Canonical retailer Overview intelligence contract.
 *
 * GOVERNING INVARIANTS
 * - LIVE DATA ONLY: production Overview metrics never use simulated,
 *   synthetic, random, demo or fabricated fallback values.
 * - Metric validity is determined server-side.
 * - Missing/insufficient evidence is a state, never an invented zero.
 * - QR exposure is distinct from a qualifying Shopper Session.
 * - Commercial impact claims obey their required evidence level.
 * - Ari may interpret evidence. Ari may not create evidence.
 */

export const OverviewMetricStatusSchema = z.enum([
  'MEASURED',
  'NO_ACTIVITY',
  'REQUIRES_POS_DATA',
  'INSUFFICIENT_EVIDENCE',
  'UNAVAILABLE',
]);

export type OverviewMetricStatus = z.infer<
  typeof OverviewMetricStatusSchema
>;

export const OverviewEvidenceReasonSchema = z.enum([
  'POS_DATA_MISSING',
  'ATTRIBUTION_UNAVAILABLE',
  'BASELINE_UNAVAILABLE',
  'INSUFFICIENT_SAMPLE',
  'INCOMPLETE_COVERAGE',
  'COMPARISON_INVALID',
  'SCOPE_MISMATCH',
  'SOURCE_UNAVAILABLE',
]);

export type OverviewEvidenceReason = z.infer<
  typeof OverviewEvidenceReasonSchema
>;

export const OverviewEvidenceLevelSchema = z.enum([
  'E0',
  'E1',
  'E2',
  'E3',
  'E4',
]);

export type OverviewEvidenceLevel = z.infer<
  typeof OverviewEvidenceLevelSchema
>;

export const OverviewScopeLevelSchema = z.enum([
  'network',
  'brand',
  'division',
  'region',
  'area',
  'store',
]);

export type OverviewScopeLevel = z.infer<
  typeof OverviewScopeLevelSchema
>;

export const OverviewScopeSchema = z.object({
  level: OverviewScopeLevelSchema,
  networkId: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
  divisionId: z.string().min(1).optional(),
  regionId: z.string().min(1).optional(),
  areaId: z.string().min(1).optional(),
  storeId: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
});

export type OverviewScope = z.infer<typeof OverviewScopeSchema>;

export const OverviewPeriodGranularitySchema = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YTD',
]);

export type OverviewPeriodGranularity = z.infer<
  typeof OverviewPeriodGranularitySchema
>;

export const OverviewTimeWindowSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  granularity: OverviewPeriodGranularitySchema,
  /**
   * Null until the retailer has configured an authoritative reporting
   * calendar. Daily/weekly/monthly operational activity may still be
   * reported without manufacturing financial-calendar assumptions.
   */
  financialYearStartMonth: z.number().int().min(1).max(12).nullable(),
  timezone: z.string().min(1).nullable(),
});

export type OverviewTimeWindow = z.infer<
  typeof OverviewTimeWindowSchema
>;

export const OverviewMetricIdSchema = z.enum([
  'basket_size_increase_percent',
  'basket_size_increase_rand',
  'sales_uplift_percent',
  'conversion_rate_percent',
  'qr_exposures',
  'qualifying_shopper_sessions',
  'ari_interactions',
  'decision_signals',
  'information_requests',
  'product_comparisons',
  'purchase_barriers_concerns',
  'product_consideration',
]);

export type OverviewMetricId = z.infer<
  typeof OverviewMetricIdSchema
>;


/**
 * Metrics intentionally exposed through the Overview trend selector.
 *
 * Activity Intelligence remains a current-period diagnostic surface rather
 * than part of the primary KPI trend selector.
 */
export const OverviewTrendMetricIdSchema = z.enum([
  'basket_size_increase_percent',
  'basket_size_increase_rand',
  'sales_uplift_percent',
  'conversion_rate_percent',
  'qr_exposures',
  'qualifying_shopper_sessions',
  'ari_interactions',
  'decision_signals',
]);

export type OverviewTrendMetricId = z.infer<
  typeof OverviewTrendMetricIdSchema
>;

export const OverviewMetricTrendRequestSchema = z.object({
  metricId: OverviewTrendMetricIdSchema,
  granularity: OverviewPeriodGranularitySchema,
});

export type OverviewMetricTrendRequest = z.infer<
  typeof OverviewMetricTrendRequestSchema
>;

export const OverviewMetricUnitSchema = z.enum([
  'COUNT',
  'PERCENT',
  'RAND',
]);

export const OverviewMetricSchema = z.object({
  metricId: OverviewMetricIdSchema,
  status: OverviewMetricStatusSchema,

  value: z.number().finite().nullable(),
  unit: OverviewMetricUnitSchema,

  evidenceLevel: OverviewEvidenceLevelSchema,
  evidenceCount: z.number().int().nonnegative(),

  reason: OverviewEvidenceReasonSchema.optional(),

  /**
   * Human-readable factual explanation of an unavailable evidence state.
   * This must not contain generated/fabricated measurements.
   */
  statusDetail: z.string().min(1).optional(),
});

export type OverviewMetric = z.infer<typeof OverviewMetricSchema>;

export const OverviewTrendPointSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  status: OverviewMetricStatusSchema,
  value: z.number().finite().nullable(),
  evidenceCount: z.number().int().nonnegative(),
  reason: OverviewEvidenceReasonSchema.optional(),
});

export type OverviewTrendPoint = z.infer<
  typeof OverviewTrendPointSchema
>;

export const OverviewMetricTrendSchema = z.object({
  metricId: OverviewMetricIdSchema,
  granularity: OverviewPeriodGranularitySchema,
  points: z.array(OverviewTrendPointSchema),
});

export type OverviewMetricTrend = z.infer<
  typeof OverviewMetricTrendSchema
>;

export const OverviewEvidenceClassSchema = z.enum([
  'EXPLICIT',
  'DERIVED',
  'INFERRED',
]);

export const OverviewEvidenceStrengthSchema = z.enum([
  'LOW',
  'MODERATE',
  'HIGHER',
]);

export const OverviewIntelligenceStatementTypeSchema = z.enum([
  'FACTUAL_OBSERVATION',
  'IDENTIFIED_INDICATOR',
  'SUGGESTED_ACTION',
]);

export const OverviewIntelligenceStatementSchema = z.object({
  type: OverviewIntelligenceStatementTypeSchema,
  statement: z.string().min(1),

  evidenceClass: OverviewEvidenceClassSchema,
  evidenceStrength: OverviewEvidenceStrengthSchema,

  supportingMetricIds: z.array(OverviewMetricIdSchema),

  /**
   * Internal provenance anchors. These identify authoritative evidence
   * supporting the statement; they are not shopper-facing content.
   */
  evidenceRefs: z.array(z.string().min(1)),
});

export type OverviewIntelligenceStatement = z.infer<
  typeof OverviewIntelligenceStatementSchema
>;

export const OverviewSummaryStatusSchema = z.enum([
  'AVAILABLE',
  'NO_ACTIVITY',
  'LIMITED_EVIDENCE',
  'UNAVAILABLE',
]);

export const OverviewGroundedSummarySchema = z.object({
  status: OverviewSummaryStatusSchema,

  factualObservations: z.array(OverviewIntelligenceStatementSchema),
  identifiedIndicators: z.array(OverviewIntelligenceStatementSchema),
  suggestedActions: z.array(OverviewIntelligenceStatementSchema),

  statusDetail: z.string().min(1).optional(),
});

export type OverviewGroundedSummary = z.infer<
  typeof OverviewGroundedSummarySchema
>;

export const OverviewFreshnessSchema = z.object({
  /**
   * Time at which this authoritative Overview result completed successfully.
   */
  calculatedAt: z.string().datetime(),

  /**
   * Most recent authoritative activity represented by the response.
   * Null when there is no activity.
   */
  latestEvidenceAt: z.string().datetime().nullable(),
});

export const OverviewIntelligenceResponseSchema = z.object({
  retailerId: z.string().min(1),

  scope: OverviewScopeSchema,
  timeWindow: OverviewTimeWindowSchema,
  freshness: OverviewFreshnessSchema,

  commercialOutcomes: z.object({
    basketSizeIncreasePercent: OverviewMetricSchema,
    basketSizeIncreaseRand: OverviewMetricSchema,
    salesUpliftPercent: OverviewMetricSchema,
    conversionRatePercent: OverviewMetricSchema,
  }),

  pointOfDecisionActivity: z.object({
    qrExposures: OverviewMetricSchema,
    qualifyingShopperSessions: OverviewMetricSchema,
    ariInteractions: OverviewMetricSchema,
    decisionSignals: OverviewMetricSchema,
  }),

  activityIntelligence: z.object({
    informationRequests: OverviewMetricSchema,
    productComparisons: OverviewMetricSchema,
    purchaseBarriersConcerns: OverviewMetricSchema,
    productConsideration: OverviewMetricSchema,
  }),

  trends: z.array(OverviewMetricTrendSchema),

  groundedSummary: OverviewGroundedSummarySchema,
});

export type OverviewIntelligenceResponse = z.infer<
  typeof OverviewIntelligenceResponseSchema
>;
