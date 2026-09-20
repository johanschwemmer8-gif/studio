import { resolveReportingPeriod } from './reporting-period-server';

const johannesburgCalendar = {
  timezone: 'Africa/Johannesburg',
  financialYearStartMonth: 7,
  weekStartsOn: 1,
  calendarType: 'GREGORIAN_MONTHLY' as const,
};

describe('resolveReportingPeriod', () => {
  test('resolves a Johannesburg reporting day to UTC instants', () => {
    const period = resolveReportingPeriod(
      new Date('2026-09-20T09:30:00.000Z'),
      'DAILY',
      johannesburgCalendar
    );

    expect(period.startAt.toISOString()).toBe(
      '2026-09-19T22:00:00.000Z'
    );
    expect(period.endAt.toISOString()).toBe(
      '2026-09-20T22:00:00.000Z'
    );
  });

  test('resolves a Monday-start Johannesburg reporting week', () => {
    const period = resolveReportingPeriod(
      new Date('2026-09-20T09:30:00.000Z'),
      'WEEKLY',
      johannesburgCalendar
    );

    expect(period.startAt.toISOString()).toBe(
      '2026-09-13T22:00:00.000Z'
    );
    expect(period.endAt.toISOString()).toBe(
      '2026-09-20T22:00:00.000Z'
    );
  });

  test('resolves a Johannesburg reporting month', () => {
    const period = resolveReportingPeriod(
      new Date('2026-09-20T09:30:00.000Z'),
      'MONTHLY',
      johannesburgCalendar
    );

    expect(period.startAt.toISOString()).toBe(
      '2026-08-31T22:00:00.000Z'
    );
    expect(period.endAt.toISOString()).toBe(
      '2026-09-30T22:00:00.000Z'
    );
  });

  test('resolves financial YTD from the configured financial-year month', () => {
    const period = resolveReportingPeriod(
      new Date('2026-09-20T09:30:00.000Z'),
      'YTD',
      johannesburgCalendar
    );

    expect(period.startAt.toISOString()).toBe(
      '2026-06-30T22:00:00.000Z'
    );
    expect(period.endAt.toISOString()).toBe(
      '2027-06-30T22:00:00.000Z'
    );
  });

  test('uses the previous calendar year when before the financial-year start month', () => {
    const period = resolveReportingPeriod(
      new Date('2026-03-15T10:00:00.000Z'),
      'YTD',
      johannesburgCalendar
    );

    expect(period.startAt.toISOString()).toBe(
      '2025-06-30T22:00:00.000Z'
    );
    expect(period.endAt.toISOString()).toBe(
      '2026-06-30T22:00:00.000Z'
    );
  });

  test('respects DST-capable IANA timezone boundaries', () => {
    const newYorkCalendar = {
      timezone: 'America/New_York',
      financialYearStartMonth: 1,
      weekStartsOn: 0,
      calendarType: 'GREGORIAN_MONTHLY' as const,
    };

    const period = resolveReportingPeriod(
      new Date('2026-07-15T16:00:00.000Z'),
      'DAILY',
      newYorkCalendar
    );

    expect(period.startAt.toISOString()).toBe(
      '2026-07-15T04:00:00.000Z'
    );
    expect(period.endAt.toISOString()).toBe(
      '2026-07-16T04:00:00.000Z'
    );
  });

  test('fails closed for an invalid reporting timezone', () => {
    expect(() =>
      resolveReportingPeriod(
        new Date('2026-09-20T09:30:00.000Z'),
        'DAILY',
        {
          ...johannesburgCalendar,
          timezone: 'Not/A_Timezone',
        }
      )
    ).toThrow('INVALID_REPORTING_TIMEZONE');
  });
});

describe('adjacent reporting-period composition', () => {
  test('resolves the previous retailer-local day from the current boundary', () => {
    const current = resolveReportingPeriod(
      new Date('2026-09-20T09:30:00.000Z'),
      'DAILY',
      johannesburgCalendar
    );

    const previous = resolveReportingPeriod(
      new Date(current.startAt.getTime() - 1),
      'DAILY',
      johannesburgCalendar
    );

    expect(previous.startAt.toISOString()).toBe(
      '2026-09-18T22:00:00.000Z'
    );
    expect(previous.endAt.toISOString()).toBe(
      current.startAt.toISOString()
    );
  });

  test('resolves the previous reporting month across a year boundary', () => {
    const current = resolveReportingPeriod(
      new Date('2026-01-15T10:00:00.000Z'),
      'MONTHLY',
      johannesburgCalendar
    );

    const previous = resolveReportingPeriod(
      new Date(current.startAt.getTime() - 1),
      'MONTHLY',
      johannesburgCalendar
    );

    expect(previous.startAt.toISOString()).toBe(
      '2025-11-30T22:00:00.000Z'
    );
    expect(previous.endAt.toISOString()).toBe(
      current.startAt.toISOString()
    );
  });

  test('keeps adjacent daily periods contiguous across a DST transition', () => {
    const newYorkCalendar = {
      timezone: 'America/New_York',
      financialYearStartMonth: 1,
      weekStartsOn: 0,
      calendarType: 'GREGORIAN_MONTHLY' as const,
    };

    const current = resolveReportingPeriod(
      new Date('2026-03-09T12:00:00.000Z'),
      'DAILY',
      newYorkCalendar
    );

    const previous = resolveReportingPeriod(
      new Date(current.startAt.getTime() - 1),
      'DAILY',
      newYorkCalendar
    );

    expect(previous.endAt.toISOString()).toBe(
      current.startAt.toISOString()
    );

    // The previous local day crosses the spring DST change and is therefore
    // 23 real hours long. Reporting periods follow local calendar boundaries,
    // not an assumed fixed 24-hour duration.
    expect(
      previous.endAt.getTime() - previous.startAt.getTime()
    ).toBe(23 * 60 * 60 * 1000);
  });
});
