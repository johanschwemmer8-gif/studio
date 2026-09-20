import { getDb } from './firebase-admin';
import { resolveOrganizationScope } from './organization-scope-server';

jest.mock('./firebase-admin', () => ({
  getDb: jest.fn(),
}));

const mockGetDb = getDb as jest.Mock;

const organizationDocument = {
  retailerId: 'retailer_a',
  type: 'org',
  data: {
    brands: [
      {
        id: 'brand_a',
        name: 'Brand A',
        divisions: [
          {
            id: 'division_a',
            name: 'Division A',
            regions: [
              {
                id: 'region_a',
                name: 'Region A',
                province: 'Gauteng',
                areas: [
                  {
                    id: 'area_a',
                    name: 'Area A',
                    stores: [
                      {
                        id: 'store_a',
                        name: 'Store A',
                      },
                      {
                        id: 'store_b',
                        name: 'Store B',
                      },
                    ],
                  },
                  {
                    id: 'area_b',
                    name: 'Area B',
                    stores: [
                      {
                        id: 'store_c',
                        name: 'Store C',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'brand_b',
        name: 'Brand B',
        divisions: [
          {
            id: 'division_b',
            name: 'Division B',
            regions: [
              {
                id: 'region_b',
                name: 'Region B',
                province: 'Western Cape',
                areas: [
                  {
                    id: 'area_c',
                    name: 'Area C',
                    stores: [
                      {
                        id: 'store_d',
                        name: 'Store D',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

function mockOrganization(
  document: Record<string, unknown> | null = organizationDocument
) {
  const get = jest.fn().mockResolvedValue({
    exists: document !== null,
    data: () => document ?? undefined,
  });

  const doc = jest.fn().mockReturnValue({ get });
  const collection = jest.fn().mockReturnValue({ doc });

  mockGetDb.mockReturnValue({
    collection,
  });

  return {
    collection,
    doc,
    get,
  };
}

describe('resolveOrganizationScope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('resolves network scope to every authoritative store', async () => {
    mockOrganization();

    const result = await resolveOrganizationScope('retailer_a', {
      level: 'network',
      networkId: 'network_a',
    });

    expect(result.storeIds.sort()).toEqual([
      'store_a',
      'store_b',
      'store_c',
      'store_d',
    ]);
  });

  test('resolves brand scope only to descendant stores', async () => {
    mockOrganization();

    const result = await resolveOrganizationScope('retailer_a', {
      level: 'brand',
      brandId: 'brand_a',
    });

    expect(result.storeIds.sort()).toEqual([
      'store_a',
      'store_b',
      'store_c',
    ]);
  });

  test('resolves division scope only through the authorized brand path', async () => {
    mockOrganization();

    const result = await resolveOrganizationScope('retailer_a', {
      level: 'division',
      brandId: 'brand_a',
      divisionId: 'division_a',
    });

    expect(result.storeIds.sort()).toEqual([
      'store_a',
      'store_b',
      'store_c',
    ]);
  });

  test('resolves region scope to its descendant stores', async () => {
    mockOrganization();

    const result = await resolveOrganizationScope('retailer_a', {
      level: 'region',
      brandId: 'brand_a',
      divisionId: 'division_a',
      regionId: 'region_a',
    });

    expect(result.storeIds.sort()).toEqual([
      'store_a',
      'store_b',
      'store_c',
    ]);
  });

  test('resolves area scope to its descendant stores', async () => {
    mockOrganization();

    const result = await resolveOrganizationScope('retailer_a', {
      level: 'area',
      brandId: 'brand_a',
      divisionId: 'division_a',
      regionId: 'region_a',
      areaId: 'area_a',
    });

    expect(result.storeIds.sort()).toEqual([
      'store_a',
      'store_b',
    ]);
  });

  test('resolves store scope to exactly one authoritative store', async () => {
    mockOrganization();

    const result = await resolveOrganizationScope('retailer_a', {
      level: 'store',
      brandId: 'brand_a',
      divisionId: 'division_a',
      regionId: 'region_a',
      areaId: 'area_a',
      storeId: 'store_a',
    });

    expect(result.storeIds).toEqual(['store_a']);
  });

  test('fails closed when an authorized scope ID is not in the hierarchy path', async () => {
    mockOrganization();

    await expect(
      resolveOrganizationScope('retailer_a', {
        level: 'store',
        brandId: 'brand_a',
        divisionId: 'division_a',
        regionId: 'region_a',
        areaId: 'area_a',
        storeId: 'store_d',
      })
    ).rejects.toThrow('AUTHORIZED_STORE_SCOPE_NOT_FOUND');
  });

  test('fails closed when organization configuration is unavailable', async () => {
    mockOrganization(null);

    await expect(
      resolveOrganizationScope('retailer_a', {
        level: 'network',
        networkId: 'network_a',
      })
    ).rejects.toThrow('ORGANIZATION_CONFIGURATION_UNAVAILABLE');
  });

  test('fails closed when organization configuration contains legacy nodes without persistent IDs', async () => {
    mockOrganization({
      retailerId: 'retailer_a',
      type: 'org',
      data: {
        brands: [
          {
            name: 'Legacy Brand',
            divisions: [],
          },
        ],
      },
    });

    await expect(
      resolveOrganizationScope('retailer_a', {
        level: 'network',
        networkId: 'network_a',
      })
    ).rejects.toThrow('ORGANIZATION_CONFIGURATION_INVALID');
  });

  test('fails closed on tenant mismatch', async () => {
    mockOrganization({
      ...organizationDocument,
      retailerId: 'retailer_b',
    });

    await expect(
      resolveOrganizationScope('retailer_a', {
        level: 'network',
        networkId: 'network_a',
      })
    ).rejects.toThrow('ORGANIZATION_TENANT_MISMATCH');
  });
});
