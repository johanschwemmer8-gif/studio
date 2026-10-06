import { verifyAuth } from '@/lib/auth-server';
import {
  resolveOrganizationScope,
} from '@/lib/organization-scope-server';
import { resolveReportingCalendar } from '@/lib/reporting-calendar-server';
import { acquireReportingEvidence } from '@/lib/reporting-evidence-server';
import { getVisualsReporting } from './get-visuals-reporting';

jest.mock('@/lib/auth-server', () => ({
  verifyAuth: jest.fn(),
}));

jest.mock('@/lib/organization-scope-server', () => ({
  resolveOrganizationScope: jest.fn(),
}));

jest.mock('@/lib/reporting-calendar-server', () => ({
  resolveReportingCalendar: jest.fn(),
}));

jest.mock('@/lib/reporting-evidence-server', () => ({
  acquireReportingEvidence: jest.fn(),
}));

const mockVerifyAuth = verifyAuth as jest.Mock;
const mockResolveOrganizationScope =
  resolveOrganizationScope as jest.Mock;
const mockResolveReportingCalendar =
  resolveReportingCalendar as jest.Mock;
const mockAcquireReportingEvidence =
  acquireReportingEvidence as jest.Mock;

function authorizedContext(
  overrides: Record<string, unknown> = {}
) {
  return {
    uid: 'retailer_user',
    retailerId: 'retailer_a',
    role: 'networkAdmin',
    scope: {
      level: 'network',
      networkId: 'network_a',
    },
    permissions: {
      dashboard: true,
      roi: false,
      visualsReporting: true,
      realTime: true,
      systemIntegration: false,
      retailMediaNetwork: false,
      manageUsers: false,
      manageOrganization: false,
      approve: false,
      export: false,
    },
    isActive: true,
    ...overrides,
  };
}

const request = {
  scope: {
    level: 'brand' as const,
    networkId: 'network_a',
    brandId: 'brand_a',
  },
  granularity: 'MONTHLY' as const,
};

describe('getVisualsReporting authorization boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyAuth.mockResolvedValue(
      authorizedContext()
    );

    mockResolveOrganizationScope.mockResolvedValue({
      retailerId: 'retailer_a',
      scope: request.scope,
      storeIds: ['store_a', 'store_b'],
    });

    mockResolveReportingCalendar.mockResolvedValue({
      timezone: 'Africa/Johannesburg',
      financialYearStartMonth: 3,
      weekStartsOn: 1,
    });

    mockAcquireReportingEvidence.mockResolvedValue({
      retailerId: 'retailer_a',
      authorizedDeploymentStoreIds: new Map(),
      exposures: [],
      sessions: [],
      events: [],
      transactions: [],
      sourcesComplete: {
        exposures: true,
        sessions: true,
        events: true,
        transactions: true,
      },
    });
  });

  test('fails closed on authentication failure', async () => {
    mockVerifyAuth.mockResolvedValue({
      uid: '',
      error: 'AUTHENTICATION_REQUIRED',
    });

    await expect(
      getVisualsReporting({
        idToken: 'invalid-token',
        request,
      })
    ).rejects.toThrow('AUTHENTICATION_REQUIRED');

    expect(
      mockResolveOrganizationScope
    ).not.toHaveBeenCalled();

    expect(
      mockAcquireReportingEvidence
    ).not.toHaveBeenCalled();
  });

  test('fails closed for an inactive account', async () => {
    mockVerifyAuth.mockResolvedValue(
      authorizedContext({
        isActive: false,
      })
    );

    await expect(
      getVisualsReporting({
        idToken: 'token',
        request,
      })
    ).rejects.toThrow('ACCOUNT_INACTIVE');

    expect(
      mockAcquireReportingEvidence
    ).not.toHaveBeenCalled();
  });

  test('fails closed without retailer tenancy', async () => {
    mockVerifyAuth.mockResolvedValue(
      authorizedContext({
        retailerId: undefined,
      })
    );

    await expect(
      getVisualsReporting({
        idToken: 'token',
        request,
      })
    ).rejects.toThrow(
      'RETAILER_AUTHORIZATION_REQUIRED'
    );

    expect(
      mockAcquireReportingEvidence
    ).not.toHaveBeenCalled();
  });

  test('fails closed without visualsReporting permission', async () => {
    const auth = authorizedContext();

    mockVerifyAuth.mockResolvedValue({
      ...auth,
      permissions: {
        ...auth.permissions,
        visualsReporting: false,
      },
    });

    await expect(
      getVisualsReporting({
        idToken: 'token',
        request,
      })
    ).rejects.toThrow(
      'VISUALS_REPORTING_PERMISSION_REQUIRED'
    );

    expect(
      mockResolveOrganizationScope
    ).not.toHaveBeenCalled();

    expect(
      mockAcquireReportingEvidence
    ).not.toHaveBeenCalled();
  });

  test('fails closed when requested scope exceeds authorization', async () => {
    const storeRequest = {
      scope: {
        level: 'store' as const,
        networkId: 'network_b',
        storeId: 'store_hostile',
      },
      granularity: 'MONTHLY' as const,
    };

    await expect(
      getVisualsReporting({
        idToken: 'token',
        request: storeRequest,
      })
    ).rejects.toThrow(
      'VISUALS_REPORTING_SCOPE_ACCESS_DENIED'
    );

    expect(
      mockResolveOrganizationScope
    ).not.toHaveBeenCalled();

    expect(
      mockAcquireReportingEvidence
    ).not.toHaveBeenCalled();
  });

  test('fails closed when reporting calendar is unavailable', async () => {
    mockResolveReportingCalendar.mockResolvedValue(null);

    await expect(
      getVisualsReporting({
        idToken: 'token',
        request,
      })
    ).rejects.toThrow(
      'REPORTING_CALENDAR_UNAVAILABLE'
    );

    expect(
      mockAcquireReportingEvidence
    ).not.toHaveBeenCalled();
  });

  test('acquires evidence only for the resolved authorized stores', async () => {
    const result = await getVisualsReporting({
      idToken: 'token',
      request,
    });

    expect(
      mockResolveOrganizationScope
    ).toHaveBeenCalledWith(
      'retailer_a',
      request.scope
    );

    expect(
      mockAcquireReportingEvidence
    ).toHaveBeenCalledTimes(1);

    const evidenceInput =
      mockAcquireReportingEvidence.mock.calls[0][0];

    expect(evidenceInput.retailerId).toBe(
      'retailer_a'
    );

    expect(
      [...evidenceInput.authorizedStoreIds]
    ).toEqual(['store_a', 'store_b']);

    expect(evidenceInput.startAt).toBeInstanceOf(Date);
    expect(evidenceInput.endAt).toBeInstanceOf(Date);

    expect(
      evidenceInput.endAt.getTime()
    ).toBeGreaterThan(
      evidenceInput.startAt.getTime()
    );

    expect(result.retailerId).toBe('retailer_a');
    expect(result.scope).toEqual(request.scope);
    expect(result.networkPerformance.qrExposures.value).toBe(0);
    expect(result.networkPerformance.qrExposures.status).toBe(
      'NO_ACTIVITY'
    );
  });
});


describe('getVisualsReporting brand reporting boundary', () => {
  test('rejects network aggregation even for a network-scoped user', async () => {
    jest.clearAllMocks();

    mockVerifyAuth.mockResolvedValue(
      authorizedContext()
    );
    const networkRequest = {
      scope: {
        level: 'network' as const,
        networkId: 'network_a',
      },
      granularity: 'MONTHLY' as const,
    };

    await expect(
      getVisualsReporting({
        idToken: 'token',
        request: networkRequest,
      })
    ).rejects.toThrow(
      'VISUALS_REPORTING_SCOPE_ACCESS_DENIED'
    );

    expect(
      mockResolveOrganizationScope
    ).not.toHaveBeenCalled();

    expect(
      mockAcquireReportingEvidence
    ).not.toHaveBeenCalled();
  });
});
