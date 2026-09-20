import { z } from 'zod';

/**
 * Canonical retailer reporting-calendar configuration.
 *
 * This configuration governs management and financial reporting periods.
 * It is deliberately separate from Campaign / Activation scheduling
 * timezones.
 *
 * No reporting-calendar value may be inferred from browser locale,
 * campaign configuration, activation configuration or retailer geography.
 */

export const ReportingCalendarTypeSchema = z.enum([
  'GREGORIAN_MONTHLY',
]);

export type ReportingCalendarType = z.infer<
  typeof ReportingCalendarTypeSchema
>;

export const ReportingCalendarDataSchema = z.object({
  /**
   * Authoritative IANA reporting timezone configured by the retailer.
   * Example: Africa/Johannesburg.
   *
   * The schema deliberately does not manufacture a default.
   */
  timezone: z.string().trim().min(1),

  /**
   * Calendar month in which the retailer's financial year begins.
   * 1 = January, 12 = December.
   */
  financialYearStartMonth: z.number().int().min(1).max(12),

  /**
   * Reporting week start using JavaScript weekday numbering.
   * 0 = Sunday ... 6 = Saturday.
   */
  weekStartsOn: z.number().int().min(0).max(6),

  /**
   * Pilot-supported reporting calendar.
   *
   * The discriminator allows later extension to 4-4-5 or other retailer
   * calendars without changing the identity of this configuration domain.
   */
  calendarType: ReportingCalendarTypeSchema,
});

export type ReportingCalendarData = z.infer<
  typeof ReportingCalendarDataSchema
>;

export const ReportingCalendarConfigurationSchema = z.object({
  retailerId: z.string().min(1),
  type: z.literal('reporting-calendar'),
  data: ReportingCalendarDataSchema,

  /**
   * Firestore timestamp provenance is validated structurally here.
   */
  updatedAt: z.object({
    seconds: z.number(),
    nanoseconds: z.number(),
  }),

  updatedBy: z.string().min(1),
});

export type ReportingCalendarConfiguration = z.infer<
  typeof ReportingCalendarConfigurationSchema
>;
