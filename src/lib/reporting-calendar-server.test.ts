import { getDb } from '@/lib/firebase-admin';
import { resolveReportingCalendar } from './reporting-calendar-server';

jest.mock('@/lib/firebase-admin', () => ({
  getDb: jest.fn(),
}));

const mockGetDb = getDb as jest.Mock;

function timestamp() {
  return {
    seconds: 1_790_000_000,
    nanoseconds: 0,
  };
}

function firestoreDocument(
  exists: boolean,
  data?: Record<string, unknown>
) {
  return {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(async () => ({
          exists,
          data: () => data,
        })),
      })),
    })),
  };
}

describe('resolveReportingCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns the authoritative retailer reporting calendar', async () => {
    mockGetDb.mockReturnValue(
      firestoreDocument(true, {
        retailerId: 'retailer_a',
        type: 'reporting-calendar',
        data: {
          timezone: 'Africa/Johannesburg',
          financialYearStartMonth: 7,
          weekStartsOn: 1,
          calendarType: 'GREGORIAN_MONTHLY',
        },
        updatedAt: timestamp(),
        updatedBy: 'user_a',
      })
    );

    await expect(
      resolveReportingCalendar('retailer_a')
    ).resolves.toEqual({
      timezone: 'Africa/Johannesburg',
      financialYearStartMonth: 7,
      weekStartsOn: 1,
      calendarType: 'GREGORIAN_MONTHLY',
    });
  });

  test('returns null when the retailer has not configured a reporting calendar', async () => {
    mockGetDb.mockReturnValue(
      firestoreDocument(false)
    );

    await expect(
      resolveReportingCalendar('retailer_a')
    ).resolves.toBeNull();
  });

  test('fails closed when infrastructure is unavailable', async () => {
    mockGetDb.mockReturnValue(null);

    await expect(
      resolveReportingCalendar('retailer_a')
    ).rejects.toThrow('INFRASTRUCTURE_UNAVAILABLE');
  });

  test('fails closed on reporting-calendar tenant mismatch', async () => {
    mockGetDb.mockReturnValue(
      firestoreDocument(true, {
        retailerId: 'retailer_b',
        type: 'reporting-calendar',
        data: {
          timezone: 'Africa/Johannesburg',
          financialYearStartMonth: 7,
          weekStartsOn: 1,
          calendarType: 'GREGORIAN_MONTHLY',
        },
        updatedAt: timestamp(),
        updatedBy: 'user_b',
      })
    );

    await expect(
      resolveReportingCalendar('retailer_a')
    ).rejects.toThrow('REPORTING_CALENDAR_TENANT_MISMATCH');
  });

  test('fails closed on malformed financial-year configuration', async () => {
    mockGetDb.mockReturnValue(
      firestoreDocument(true, {
        retailerId: 'retailer_a',
        type: 'reporting-calendar',
        data: {
          timezone: 'Africa/Johannesburg',
          financialYearStartMonth: 13,
          weekStartsOn: 1,
          calendarType: 'GREGORIAN_MONTHLY',
        },
        updatedAt: timestamp(),
        updatedBy: 'user_a',
      })
    );

    await expect(
      resolveReportingCalendar('retailer_a')
    ).rejects.toThrow();
  });

  test('fails closed when reporting timezone is absent', async () => {
    mockGetDb.mockReturnValue(
      firestoreDocument(true, {
        retailerId: 'retailer_a',
        type: 'reporting-calendar',
        data: {
          financialYearStartMonth: 7,
          weekStartsOn: 1,
          calendarType: 'GREGORIAN_MONTHLY',
        },
        updatedAt: timestamp(),
        updatedBy: 'user_a',
      })
    );

    await expect(
      resolveReportingCalendar('retailer_a')
    ).rejects.toThrow();
  });

  test('does not accept unsupported reporting calendar types', async () => {
    mockGetDb.mockReturnValue(
      firestoreDocument(true, {
        retailerId: 'retailer_a',
        type: 'reporting-calendar',
        data: {
          timezone: 'Africa/Johannesburg',
          financialYearStartMonth: 7,
          weekStartsOn: 1,
          calendarType: 'FOUR_FOUR_FIVE',
        },
        updatedAt: timestamp(),
        updatedBy: 'user_a',
      })
    );

    await expect(
      resolveReportingCalendar('retailer_a')
    ).rejects.toThrow();
  });
});
