'use server';

/**
 * Authoritative retailer Reporting Calendar management.
 *
 * SECURITY:
 * - Firebase Authentication establishes identity.
 * - /users/{uid} establishes retailer tenancy and permissions.
 * - retailerId is NEVER accepted from the client.
 * - manageOrganization is required for writes.
 *
 * PILOT CONTRACT:
 * - GREGORIAN_MONTHLY only.
 * - No inferred timezone.
 * - No inferred financial-year start.
 */

import { verifyAuth } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';
import {
  ReportingCalendarConfigurationSchema,
  ReportingCalendarDataSchema,
  type ReportingCalendarData,
} from '@/lib/schemas/reporting-calendar';

export type ReportingCalendarResult =
  | {
      success: true;
      configured: boolean;
      calendar: ReportingCalendarData | null;
    }
  | {
      success: false;
      configured: false;
      calendar: null;
      error: string;
    };

function authFailed(
  result: Awaited<ReturnType<typeof verifyAuth>>
): result is { uid: ''; error: string } {
  return result.uid === '';
}

export async function getReportingCalendarConfiguration(
  idToken?: string
): Promise<ReportingCalendarResult> {
  const auth = await verifyAuth(idToken);

  if (authFailed(auth)) {
    return {
      success: false,
      configured: false,
      calendar: null,
      error: auth.error,
    };
  }

  if (!auth.retailerId) {
    return {
      success: false,
      configured: false,
      calendar: null,
      error: 'IDENTITY_NOT_PROVISIONED: Account not linked to a retailer.',
    };
  }

  if (!auth.permissions.dashboard && !auth.permissions.manageOrganization) {
    return {
      success: false,
      configured: false,
      calendar: null,
      error: 'ACCESS_DENIED: Reporting Calendar access is not authorized.',
    };
  }

  const db = getDb();

  if (!db) {
    return {
      success: false,
      configured: false,
      calendar: null,
      error: 'Reporting Calendar database unavailable.',
    };
  }

  try {
    const snapshot = await db
      .collection('configurations')
      .doc(`${auth.retailerId}_reporting_calendar`)
      .get();

    if (!snapshot.exists) {
      return {
        success: true,
        configured: false,
        calendar: null,
      };
    }

    const parsed = ReportingCalendarConfigurationSchema.safeParse(snapshot.data());

    if (!parsed.success || parsed.data.retailerId !== auth.retailerId) {
      return {
        success: false,
        configured: false,
        calendar: null,
        error:
          'INVALID_REPORTING_CALENDAR: Stored Reporting Calendar is invalid.',
      };
    }

    return {
      success: true,
      configured: true,
      calendar: parsed.data.data,
    };
  } catch (error) {
    console.error('[Reporting Calendar] Read failed:', error);

    return {
      success: false,
      configured: false,
      calendar: null,
      error: 'Reporting Calendar could not be loaded.',
    };
  }
}

export async function saveReportingCalendarConfiguration(
  idToken: string | undefined,
  input: unknown
): Promise<ReportingCalendarResult> {
  const auth = await verifyAuth(idToken);

  if (authFailed(auth)) {
    return {
      success: false,
      configured: false,
      calendar: null,
      error: auth.error,
    };
  }

  if (!auth.retailerId) {
    return {
      success: false,
      configured: false,
      calendar: null,
      error: 'IDENTITY_NOT_PROVISIONED: Account not linked to a retailer.',
    };
  }

  if (!auth.permissions.manageOrganization) {
    return {
      success: false,
      configured: false,
      calendar: null,
      error:
        'ACCESS_DENIED: manageOrganization permission is required to change the Reporting Calendar.',
    };
  }

  const parsed = ReportingCalendarDataSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      configured: false,
      calendar: null,
      error: 'VALIDATION_FAILED: Reporting Calendar configuration is invalid.',
    };
  }

  if (parsed.data.calendarType !== 'GREGORIAN_MONTHLY') {
    return {
      success: false,
      configured: false,
      calendar: null,
      error:
        'VALIDATION_FAILED: Only Calendar Months are currently supported.',
    };
  }

  try {
    // Validate that Intl recognizes the supplied IANA timezone.
    new Intl.DateTimeFormat('en-ZA', {
      timeZone: parsed.data.timezone,
    }).format(new Date());
  } catch {
    return {
      success: false,
      configured: false,
      calendar: null,
      error: 'VALIDATION_FAILED: Reporting timezone is not valid.',
    };
  }

  const db = getDb();

  if (!db) {
    return {
      success: false,
      configured: false,
      calendar: null,
      error: 'Reporting Calendar database unavailable.',
    };
  }

  try {
    await db
      .collection('configurations')
      .doc(`${auth.retailerId}_reporting_calendar`)
      .set({
        retailerId: auth.retailerId,
        type: 'reporting-calendar',
        data: parsed.data,
        updatedAt: new Date(),
        updatedBy: auth.uid,
      });

    return {
      success: true,
      configured: true,
      calendar: parsed.data,
    };
  } catch (error) {
    console.error('[Reporting Calendar] Save failed:', error);

    return {
      success: false,
      configured: false,
      calendar: null,
      error: 'Reporting Calendar could not be saved.',
    };
  }
}
