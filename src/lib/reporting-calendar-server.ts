import { getDb } from '@/lib/firebase-admin';
import {
  ReportingCalendarConfigurationSchema,
  type ReportingCalendarData,
} from '@/lib/schemas/reporting-calendar';

/**
 * Reads the authoritative retailer reporting calendar.
 *
 * Missing configuration is not an infrastructure failure. It means the
 * retailer has not yet configured its reporting calendar, so callers may
 * continue with reporting features that do not require financial-calendar
 * semantics while financial/YTD features remain unavailable.
 *
 * Malformed or cross-tenant configuration fails closed.
 */
export async function resolveReportingCalendar(
  retailerId: string
): Promise<ReportingCalendarData | null> {
  const db = getDb();

  if (!db) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const snapshot = await db
    .collection('configurations')
    .doc(`${retailerId}_reporting_calendar`)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const configuration =
    ReportingCalendarConfigurationSchema.parse(snapshot.data());

  if (configuration.retailerId !== retailerId) {
    throw new Error('REPORTING_CALENDAR_TENANT_MISMATCH');
  }

  return configuration.data;
}
