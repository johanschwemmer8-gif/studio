import {
  addDays,
  addMonths,
  addYears,
} from 'date-fns';

import type { ReportingCalendarData } from '@/lib/schemas/reporting-calendar';
import type { OverviewPeriodGranularity } from '@/lib/schemas/overview-intelligence';

export type ReportingPeriod = {
  startAt: Date;
  endAt: Date;
  granularity: OverviewPeriodGranularity;
};

/**
 * Returns the calendar components of an instant as observed in an
 * authoritative IANA reporting timezone.
 */
function zonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

/**
 * Converts a retailer-local wall-clock time into the corresponding UTC
 * instant without assuming a fixed timezone offset.
 *
 * Intl is used deliberately so the configured IANA timezone remains the
 * authority and DST transitions are respected.
 */
function zonedDateToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date {
  const targetAsUtc = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second
  );

  let candidate = new Date(targetAsUtc);

  // Iteratively reconcile the timezone offset at the candidate instant.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const observed = zonedParts(candidate, timeZone);

    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second
    );

    const difference = targetAsUtc - observedAsUtc;

    if (difference === 0) {
      return candidate;
    }

    candidate = new Date(candidate.getTime() + difference);
  }

  const finalObserved = zonedParts(candidate, timeZone);

  if (
    finalObserved.year !== year ||
    finalObserved.month !== month ||
    finalObserved.day !== day ||
    finalObserved.hour !== hour ||
    finalObserved.minute !== minute ||
    finalObserved.second !== second
  ) {
    throw new Error('REPORTING_TIMEZONE_BOUNDARY_UNRESOLVABLE');
  }

  return candidate;
}

function localCalendarDate(
  date: Date,
  timeZone: string
): Date {
  const local = zonedParts(date, timeZone);

  // This Date is used only as a neutral Gregorian calendar arithmetic
  // container. It does not itself represent the reporting instant.
  return new Date(
    Date.UTC(local.year, local.month - 1, local.day)
  );
}

function calendarDateParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function startOfLocalDay(
  calendarDate: Date,
  timeZone: string
): Date {
  const parts = calendarDateParts(calendarDate);

  return zonedDateToUtc(
    parts.year,
    parts.month,
    parts.day,
    0,
    0,
    0,
    timeZone
  );
}

/**
 * Resolve the reporting period containing `now`.
 *
 * Period semantics come exclusively from the retailer's authoritative
 * Reporting Calendar configuration.
 *
 * endAt is exclusive. This avoids double-counting evidence exactly on the
 * boundary between adjacent periods.
 */
export function resolveReportingPeriod(
  now: Date,
  granularity: OverviewPeriodGranularity,
  calendar: ReportingCalendarData
): ReportingPeriod {
  if (Number.isNaN(now.getTime())) {
    throw new Error('INVALID_REPORTING_INSTANT');
  }

  // Validate the configured IANA timezone before constructing boundaries.
  try {
    new Intl.DateTimeFormat('en-CA', {
      timeZone: calendar.timezone,
    }).format(now);
  } catch {
    throw new Error('INVALID_REPORTING_TIMEZONE');
  }

  const today = localCalendarDate(now, calendar.timezone);

  if (granularity === 'DAILY') {
    return {
      startAt: startOfLocalDay(today, calendar.timezone),
      endAt: startOfLocalDay(
        addDays(today, 1),
        calendar.timezone
      ),
      granularity,
    };
  }

  if (granularity === 'WEEKLY') {
    const weekday = today.getUTCDay();
    const daysSinceWeekStart =
      (weekday - calendar.weekStartsOn + 7) % 7;

    const weekStart = addDays(today, -daysSinceWeekStart);

    return {
      startAt: startOfLocalDay(
        weekStart,
        calendar.timezone
      ),
      endAt: startOfLocalDay(
        addDays(weekStart, 7),
        calendar.timezone
      ),
      granularity,
    };
  }

  if (granularity === 'MONTHLY') {
    const monthStart = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        1
      )
    );

    return {
      startAt: startOfLocalDay(
        monthStart,
        calendar.timezone
      ),
      endAt: startOfLocalDay(
        addMonths(monthStart, 1),
        calendar.timezone
      ),
      granularity,
    };
  }

  if (granularity === 'YTD') {
    const currentYear = today.getUTCFullYear();
    const currentMonth = today.getUTCMonth() + 1;

    const financialYear =
      currentMonth >= calendar.financialYearStartMonth
        ? currentYear
        : currentYear - 1;

    const financialYearStart = new Date(
      Date.UTC(
        financialYear,
        calendar.financialYearStartMonth - 1,
        1
      )
    );

    const nextFinancialYearStart = addYears(
      financialYearStart,
      1
    );

    return {
      startAt: startOfLocalDay(
        financialYearStart,
        calendar.timezone
      ),
      endAt: startOfLocalDay(
        nextFinancialYearStart,
        calendar.timezone
      ),
      granularity,
    };
  }

  const exhaustive: never = granularity;
  throw new Error(
    `UNSUPPORTED_REPORTING_GRANULARITY:${exhaustive}`
  );
}
