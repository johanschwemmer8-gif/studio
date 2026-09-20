/**
 * Reporting Calendar management security contract.
 *
 * Verifies:
 * - tenant identity comes from authenticated authorization context;
 * - reads are tenant-bound;
 * - writes require manageOrganization;
 * - invalid calendar input is rejected;
 * - invalid timezone is rejected;
 * - valid configuration is written only to the authenticated tenant path.
 */

const mockVerifyAuth = jest.fn();
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDoc = jest.fn(() => ({
  get: mockGet,
  set: mockSet,
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
}));
const mockGetDb = jest.fn(() => ({
  collection: mockCollection,
}));

jest.mock('@/lib/auth-server', () => ({
  verifyAuth: (...args: unknown[]) => mockVerifyAuth(...args),
}));

jest.mock('@/lib/firebase-admin', () => ({
  getDb: () => mockGetDb(),
}));

import {
  getReportingCalendarConfiguration,
  saveReportingCalendarConfiguration,
} from './manage-reporting-calendar';

const validCalendar = {
  timezone: 'Africa/Johannesburg',
  financialYearStartMonth: 7,
  weekStartsOn: 1,
  calendarType: 'GREGORIAN_MONTHLY' as const,
};

function authorizedUser(
  overrides: Record<string, unknown> = {}
) {
  return {
    uid: 'user-1',
    retailerId: 'retailer-a',
    role: 'networkOwner',
    scope: {
      level: 'network',
      networkId: 'network-a',
    },
    permissions: {
      dashboard: true,
      roi: true,
      visualsReporting: true,
      realTime: true,
      abTesting: true,
      systemIntegration: true,
      retailMediaNetwork: true,
      manageUsers: true,
      manageOrganization: true,
      approve: true,
      export: true,
    },
    isActive: true,
    ...overrides,
  };
}

describe('manage-reporting-calendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetDb.mockReturnValue({
      collection: mockCollection,
    });

    mockCollection.mockReturnValue({
      doc: mockDoc,
    });

    mockDoc.mockReturnValue({
      get: mockGet,
      set: mockSet,
    });

    mockSet.mockResolvedValue(undefined);
  });

  it('fails closed when authentication fails', async () => {
    mockVerifyAuth.mockResolvedValue({
      uid: '',
      error: 'Authentication required.',
    });

    const result =
      await getReportingCalendarConfiguration('bad-token');

    expect(result.success).toBe(false);
    expect(mockCollection).not.toHaveBeenCalled();
  });

  it('reads only the authenticated retailer calendar document', async () => {
    mockVerifyAuth.mockResolvedValue(authorizedUser());

    mockGet.mockResolvedValue({
      exists: false,
    });

    const result =
      await getReportingCalendarConfiguration('token');

    expect(result).toEqual({
      success: true,
      configured: false,
      calendar: null,
    });

    expect(mockCollection).toHaveBeenCalledWith('configurations');
    expect(mockDoc).toHaveBeenCalledWith(
      'retailer-a_reporting_calendar'
    );
  });

  it('rejects a stored cross-tenant calendar document', async () => {
    mockVerifyAuth.mockResolvedValue(authorizedUser());

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        retailerId: 'retailer-b',
        type: 'reporting-calendar',
        data: validCalendar,
        updatedAt: new Date(),
        updatedBy: 'user-2',
      }),
    });

    const result =
      await getReportingCalendarConfiguration('token');

    expect(result.success).toBe(false);
  });

  it('rejects writes without manageOrganization permission', async () => {
    const auth = authorizedUser();

    mockVerifyAuth.mockResolvedValue({
      ...auth,
      permissions: {
        ...auth.permissions,
        manageOrganization: false,
      },
    });

    const result =
      await saveReportingCalendarConfiguration(
        'token',
        validCalendar
      );

    expect(result.success).toBe(false);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('rejects invalid calendar input', async () => {
    mockVerifyAuth.mockResolvedValue(authorizedUser());

    const result =
      await saveReportingCalendarConfiguration('token', {
        ...validCalendar,
        financialYearStartMonth: 13,
      });

    expect(result.success).toBe(false);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('rejects an invalid reporting timezone', async () => {
    mockVerifyAuth.mockResolvedValue(authorizedUser());

    const result =
      await saveReportingCalendarConfiguration('token', {
        ...validCalendar,
        timezone: 'Not/A_Real_Timezone',
      });

    expect(result.success).toBe(false);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('writes a valid calendar only to the authenticated retailer path', async () => {
    mockVerifyAuth.mockResolvedValue(authorizedUser());

    const result =
      await saveReportingCalendarConfiguration(
        'token',
        validCalendar
      );

    expect(result.success).toBe(true);

    expect(mockCollection).toHaveBeenCalledWith('configurations');

    expect(mockDoc).toHaveBeenCalledWith(
      'retailer-a_reporting_calendar'
    );

    expect(mockSet).toHaveBeenCalledTimes(1);

    const written = mockSet.mock.calls[0][0];

    expect(written).toMatchObject({
      retailerId: 'retailer-a',
      type: 'reporting-calendar',
      data: validCalendar,
      updatedBy: 'user-1',
    });

    expect(written.updatedAt).toBeInstanceOf(Date);
  });
});
