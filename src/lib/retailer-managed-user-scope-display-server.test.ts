const listOrganizationScopeChildrenMock = jest.fn();

jest.mock('./organization-scope-server', () => ({
  listOrganizationScopeChildren: (
    retailerId: string,
    scope: unknown
  ) => listOrganizationScopeChildrenMock(retailerId, scope),
}));

import {
  resolveRetailerManagedUserScopeDisplayName,
} from './retailer-managed-user-scope-display-server';

describe('retailer managed user scope display resolver', () => {
  beforeEach(() => {
    listOrganizationScopeChildrenMock.mockReset();
  });

  test('renders network scope without exposing its ID', async () => {
    await expect(
      resolveRetailerManagedUserScopeDisplayName(
        'retailer_a',
        { level: 'network', networkId: 'network_internal' },
        { level: 'network', networkId: 'network_internal' }
      )
    ).resolves.toBe('Network');

    expect(listOrganizationScopeChildrenMock).not.toHaveBeenCalled();
  });

  test('resolves a brand display name from authoritative hierarchy', async () => {
    listOrganizationScopeChildrenMock.mockResolvedValueOnce([
      {
        scope: {
          level: 'brand',
          networkId: 'network_a',
          brandId: 'brand_a',
        },
        displayName: 'Brand A',
      },
    ]);

    await expect(
      resolveRetailerManagedUserScopeDisplayName(
        'retailer_a',
        { level: 'network', networkId: 'network_a' },
        {
          level: 'brand',
          networkId: 'network_a',
          brandId: 'brand_a',
        }
      )
    ).resolves.toBe('Brand A');
  });

  test('resolves a deep store display name through authoritative ancestry', async () => {
    listOrganizationScopeChildrenMock
      .mockResolvedValueOnce([
        {
          scope: {
            level: 'brand',
            networkId: 'network_a',
            brandId: 'brand_a',
          },
          displayName: 'Brand A',
        },
      ])
      .mockResolvedValueOnce([
        {
          scope: {
            level: 'division',
            networkId: 'network_a',
            brandId: 'brand_a',
            divisionId: 'division_a',
          },
          displayName: 'Division A',
        },
      ])
      .mockResolvedValueOnce([
        {
          scope: {
            level: 'region',
            networkId: 'network_a',
            brandId: 'brand_a',
            divisionId: 'division_a',
            regionId: 'region_a',
          },
          displayName: 'Region A',
        },
      ])
      .mockResolvedValueOnce([
        {
          scope: {
            level: 'area',
            networkId: 'network_a',
            brandId: 'brand_a',
            divisionId: 'division_a',
            regionId: 'region_a',
            areaId: 'area_a',
          },
          displayName: 'Area A',
        },
      ])
      .mockResolvedValueOnce([
        {
          scope: {
            level: 'store',
            networkId: 'network_a',
            brandId: 'brand_a',
            divisionId: 'division_a',
            regionId: 'region_a',
            areaId: 'area_a',
            storeId: 'store_a',
          },
          displayName: 'Store A',
        },
      ]);

    await expect(
      resolveRetailerManagedUserScopeDisplayName(
        'retailer_a',
        { level: 'network', networkId: 'network_a' },
        {
          level: 'store',
          networkId: 'network_a',
          brandId: 'brand_a',
          divisionId: 'division_a',
          regionId: 'region_a',
          areaId: 'area_a',
          storeId: 'store_a',
        }
      )
    ).resolves.toBe('Store A');

    expect(listOrganizationScopeChildrenMock).toHaveBeenCalledTimes(5);
  });

  test('never falls back to a raw organization ID', async () => {
    listOrganizationScopeChildrenMock.mockResolvedValue([]);

    await expect(
      resolveRetailerManagedUserScopeDisplayName(
        'retailer_a',
        { level: 'network', networkId: 'network_a' },
        {
          level: 'brand',
          networkId: 'network_a',
          brandId: 'brand_internal_secret',
        }
      )
    ).resolves.toBe('Brand');
  });
});
