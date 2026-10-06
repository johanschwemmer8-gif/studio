import { verifyAuth } from '@/lib/auth-server';
import {
  getVisualsReportingBrandNavigation,
  listOrganizationScopeChildren,
} from '@/lib/organization-scope-server';

import { getVisualsReportingNavigation } from './get-visuals-reporting-navigation';

jest.mock('@/lib/auth-server', () => ({
  verifyAuth: jest.fn(),
}));

jest.mock('@/lib/organization-scope-server', () => ({
  getVisualsReportingBrandNavigation: jest.fn(),
  listOrganizationScopeChildren: jest.fn(),
}));

const mockVerifyAuth = verifyAuth as jest.Mock;
const mockGetBrandNavigation =
  getVisualsReportingBrandNavigation as jest.Mock;
const mockListChildren =
  listOrganizationScopeChildren as jest.Mock;

function authorizedContext(
  overrides: Record<string, unknown> = {},
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

const brandA = {
  scope: {
    level: 'brand' as const,
    networkId: 'network_a',
    brandId: 'brand_a',
  },
  displayName: 'Brand A',
};

const brandB = {
  scope: {
    level: 'brand' as const,
    networkId: 'network_a',
    brandId: 'brand_b',
  },
  displayName: 'Brand B',
};

const brandANavigation = {
  brand: brandA,
  divisions: [],
  regions: [],
  areas: [],
  stores: [],
};

describe('getVisualsReportingNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyAuth.mockResolvedValue(
      authorizedContext(),
    );

    mockListChildren.mockResolvedValue([
      brandA,
      brandB,
    ]);

    mockGetBrandNavigation.mockResolvedValue(
      brandANavigation,
    );
  });

  test('fails closed on authentication failure', async () => {
    mockVerifyAuth.mockResolvedValue({
      uid: '',
      error: 'AUTHENTICATION_REQUIRED',
    });

    await expect(
      getVisualsReportingNavigation({
        idToken: 'invalid-token',
        selectedBrandId: 'brand_a',
      }),
    ).rejects.toThrow('AUTHENTICATION_REQUIRED');

    expect(
      mockGetBrandNavigation,
    ).not.toHaveBeenCalled();
  });

  test('fails closed for an inactive account', async () => {
    mockVerifyAuth.mockResolvedValue(
      authorizedContext({
        isActive: false,
      }),
    );

    await expect(
      getVisualsReportingNavigation({
        idToken: 'token',
        selectedBrandId: 'brand_a',
      }),
    ).rejects.toThrow('ACCOUNT_INACTIVE');
  });

  test('fails closed without retailer tenancy', async () => {
    mockVerifyAuth.mockResolvedValue(
      authorizedContext({
        retailerId: undefined,
      }),
    );

    await expect(
      getVisualsReportingNavigation({
        idToken: 'token',
        selectedBrandId: 'brand_a',
      }),
    ).rejects.toThrow(
      'RETAILER_AUTHORIZATION_REQUIRED',
    );
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
      getVisualsReportingNavigation({
        idToken: 'token',
        selectedBrandId: 'brand_a',
      }),
    ).rejects.toThrow(
      'VISUALS_REPORTING_PERMISSION_REQUIRED',
    );
  });

  test('network-scoped user receives every brand in its portfolio', async () => {
    const result =
      await getVisualsReportingNavigation({
        idToken: 'token',
        selectedBrandId: 'brand_a',
      });

    expect(result.brandPortfolio).toEqual([
      brandA,
      brandB,
    ]);

    expect(result.selectedBrand).toEqual(
      brandA,
    );

    expect(mockListChildren).toHaveBeenCalledWith(
      'retailer_a',
      {
        level: 'network',
        networkId: 'network_a',
      },
    );
  });

  test('network-scoped user may select another brand in its own portfolio', async () => {
    mockGetBrandNavigation.mockResolvedValue({
      brand: brandB,
      divisions: [],
      regions: [],
      areas: [],
      stores: [],
    });

    const result =
      await getVisualsReportingNavigation({
        idToken: 'token',
        selectedBrandId: 'brand_b',
      });

    expect(result.selectedBrand).toEqual(
      brandB,
    );

    expect(
      mockGetBrandNavigation,
    ).toHaveBeenCalledWith(
      'retailer_a',
      'network_a',
      'brand_b',
    );
  });

  test('brand-bound user receives only its authorised brand', async () => {
    mockVerifyAuth.mockResolvedValue(
      authorizedContext({
        role: 'storeManager',
        scope: {
          level: 'store',
          networkId: 'network_a',
          brandId: 'brand_a',
          divisionId: 'division_a',
          regionId: 'region_a',
          areaId: 'area_a',
          storeId: 'store_a',
        },
      }),
    );

    const result =
      await getVisualsReportingNavigation({
        idToken: 'token',
        selectedBrandId: 'brand_a',
      });

    expect(result.brandPortfolio).toEqual([
      brandA,
    ]);

    expect(
      mockListChildren,
    ).not.toHaveBeenCalled();
  });

  test('brand-bound user cannot select a sister-company brand', async () => {
    mockVerifyAuth.mockResolvedValue(
      authorizedContext({
        role: 'regionalManager',
        scope: {
          level: 'region',
          networkId: 'network_a',
          brandId: 'brand_a',
          divisionId: 'division_a',
          regionId: 'region_a',
        },
      }),
    );

    await expect(
      getVisualsReportingNavigation({
        idToken: 'token',
        selectedBrandId: 'brand_b',
      }),
    ).rejects.toThrow(
      'VISUALS_REPORTING_BRAND_ACCESS_DENIED',
    );

    expect(
      mockGetBrandNavigation,
    ).not.toHaveBeenCalled();
  });

  test('returns all organisational levels from the selected brand projection', async () => {
    const division = {
      scope: {
        level: 'division' as const,
        networkId: 'network_a',
        brandId: 'brand_a',
        divisionId: 'division_a',
      },
      displayName: 'Division A',
    };

    const store = {
      scope: {
        level: 'store' as const,
        networkId: 'network_a',
        brandId: 'brand_a',
        divisionId: 'division_a',
        regionId: 'region_a',
        areaId: 'area_a',
        storeId: 'store_a',
      },
      displayName: 'Store A',
    };

    mockGetBrandNavigation.mockResolvedValue({
      brand: brandA,
      divisions: [division],
      regions: [],
      areas: [],
      stores: [store],
    });

    const result =
      await getVisualsReportingNavigation({
        idToken: 'token',
        selectedBrandId: 'brand_a',
      });

    expect(result.divisions).toEqual([
      division,
    ]);
    expect(result.stores).toEqual([store]);
  });
});

describe('getVisualsReportingNavigation bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyAuth.mockResolvedValue(
      authorizedContext(),
    );

    mockListChildren.mockResolvedValue([
      brandA,
      brandB,
    ]);

    mockGetBrandNavigation.mockResolvedValue(
      brandANavigation,
    );
  });

  test('network-scoped user bootstraps to the first authoritative brand when no brand is selected', async () => {
    const result =
      await getVisualsReportingNavigation({
        idToken: 'token',
      });

    expect(result.brandPortfolio).toEqual([
      brandA,
      brandB,
    ]);

    expect(result.selectedBrand).toEqual(
      brandA,
    );

    expect(
      mockGetBrandNavigation,
    ).toHaveBeenCalledWith(
      'retailer_a',
      'network_a',
      'brand_a',
    );
  });

  test('brand-bound user bootstraps directly to its authorised brand', async () => {
    mockVerifyAuth.mockResolvedValue(
      authorizedContext({
        role: 'storeManager',
        scope: {
          level: 'store',
          networkId: 'network_a',
          brandId: 'brand_a',
          divisionId: 'division_a',
          regionId: 'region_a',
          areaId: 'area_a',
          storeId: 'store_a',
        },
      }),
    );

    const result =
      await getVisualsReportingNavigation({
        idToken: 'token',
      });

    expect(result.brandPortfolio).toEqual([
      brandA,
    ]);

    expect(result.selectedBrand).toEqual(
      brandA,
    );

    expect(
      mockGetBrandNavigation,
    ).toHaveBeenCalledWith(
      'retailer_a',
      'network_a',
      'brand_a',
    );
  });
});
