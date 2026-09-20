import { z } from 'zod';

import { OverviewScopeSchema } from './overview-intelligence';

/**
 * Authoritative Scan Statistics.
 *
 * Scan Statistics is an operational QR/POD evidence surface.
 *
 * Identity:
 * Retailer -> Campaign -> Activation -> Deployment -> QR
 *
 * GTIN is deliberately absent from primary Scan Statistics identity.
 */

export const ScanStatisticsStatusSchema = z.enum([
  'MEASURED',
  'NO_ACTIVITY',
  'UNAVAILABLE',
]);

export type ScanStatisticsStatus = z.infer<
  typeof ScanStatisticsStatusSchema
>;

export const ScanStatisticsReasonSchema = z.enum([
  'INCOMPLETE_COVERAGE',
  'NO_DENOMINATOR',
]);

export type ScanStatisticsReason = z.infer<
  typeof ScanStatisticsReasonSchema
>;

export const ScanStatisticsCountMetricSchema = z.object({
  status: ScanStatisticsStatusSchema,
  value: z.number().int().nonnegative().nullable(),
  reason: ScanStatisticsReasonSchema.optional(),
});

export type ScanStatisticsCountMetric = z.infer<
  typeof ScanStatisticsCountMetricSchema
>;

export const ScanStatisticsRateMetricSchema = z.object({
  status: ScanStatisticsStatusSchema,
  value: z.number().nonnegative().nullable(),
  reason: ScanStatisticsReasonSchema.optional(),
});

export type ScanStatisticsRateMetric = z.infer<
  typeof ScanStatisticsRateMetricSchema
>;

export const ActivationPerformanceRowSchema = z.object({
  activationId: z.string().min(1),
  qrCodeId: z.string().min(1),
  campaignId: z.string().min(1),
  deploymentId: z.string().min(1),
  storeId: z.string().min(1),
  storeName: z.string().min(1),

  qrExposures: z.number().int().nonnegative(),
  qualifyingShopperSessions: z.number().int().nonnegative(),

  exposureToSessionRatePercent: z.number().nonnegative().nullable(),

  latestExposureAt: z.string().datetime().nullable(),
});

export type ActivationPerformanceRow = z.infer<
  typeof ActivationPerformanceRowSchema
>;

export const ScanStatisticsResponseSchema = z.object({
  retailerId: z.string().min(1),

  scope: OverviewScopeSchema,

  evidenceWindow: z.object({
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
  }),

  qrExposures: ScanStatisticsCountMetricSchema,
  qualifyingShopperSessions: ScanStatisticsCountMetricSchema,
  exposureToSessionRatePercent: ScanStatisticsRateMetricSchema,

  activationPerformance: z.array(ActivationPerformanceRowSchema),

  latestEvidenceAt: z.string().datetime().nullable(),
  calculatedAt: z.string().datetime(),
});

export type ScanStatisticsResponse = z.infer<
  typeof ScanStatisticsResponseSchema
>;
