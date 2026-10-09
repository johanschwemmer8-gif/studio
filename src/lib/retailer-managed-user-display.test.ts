import {
  retailerRoleLabel,
  retailerScopeLevelLabel,
  retailerSidebarAccessSummary,
  retailerUserStatusLabel,
} from './retailer-managed-user-display';

describe('retailer managed user presentation', () => {
  test('renders canonical retailer role labels', () => {
    expect(retailerRoleLabel('networkAdmin')).toBe('Network Admin');
    expect(retailerRoleLabel('brandManager')).toBe('Brand Manager');
    expect(retailerRoleLabel('storeUser')).toBe('Store User');
    expect(retailerRoleLabel('analyst')).toBe('Analyst');
  });

  test('renders scope level without exposing a raw organization ID', () => {
    expect(
      retailerScopeLevelLabel({
        level: 'store',
        networkId: 'network_internal',
        brandId: 'brand_internal',
        divisionId: 'division_internal',
        regionId: 'region_internal',
        areaId: 'area_internal',
        storeId: 'store_internal',
      })
    ).toBe('Store');
  });

  test('preserves legacy undefined sidebar access semantics', () => {
    expect(
      retailerSidebarAccessSummary(undefined, 15)
    ).toBe('Legacy access');
  });

  test('distinguishes explicit zero access from legacy access', () => {
    expect(
      retailerSidebarAccessSummary([], 15)
    ).toBe('0 of 15');
  });

  test('summarizes explicit sidebar assignment count', () => {
    expect(
      retailerSidebarAccessSummary(
        ['dashboard', 'products', 'qrManagement'],
        15
      )
    ).toBe('3 of 15');
  });

  test('renders active and suspended lifecycle states', () => {
    expect(retailerUserStatusLabel(true)).toBe('Active');
    expect(retailerUserStatusLabel(false)).toBe('Suspended');
  });
});
