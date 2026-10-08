import {
  RETAILER_FUNCTIONAL_AREA_IDS,
  RETAILER_NAVIGATION,
  RETAILER_NAVIGATION_GROUPS,
  isRetailerFunctionalArea,
  isSidebarAccess,
} from './retailer-navigation';

describe('Retailer navigation authorization contract', () => {
  it('defines exactly fourteen functional areas', () => {
    expect(RETAILER_FUNCTIONAL_AREA_IDS).toHaveLength(14);
    expect(RETAILER_NAVIGATION).toHaveLength(14);
  });

  it('has a one-to-one mapping between functional IDs and navigation items', () => {
    const ids = RETAILER_NAVIGATION.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(
      new Set(RETAILER_FUNCTIONAL_AREA_IDS)
    );
  });

  it('has unique routes', () => {
    const routes = RETAILER_NAVIGATION.map((item) => item.href);

    expect(new Set(routes).size).toBe(routes.length);
  });

  it('uses only Retailer MVP routes', () => {
    for (const item of RETAILER_NAVIGATION) {
      expect(item.href.startsWith('/retailer-mvp/')).toBe(true);
    }
  });

  it('defines the seven current navigation groups in display order', () => {
    expect(RETAILER_NAVIGATION_GROUPS).toEqual([
      'Overview',
      'Catalog & Products',
      'Shopper Experience',
      'Retail Media',
      'Operations & Integrations',
      'Intelligence',
      'Administration',
    ]);
  });

  it('assigns every item to a canonical group', () => {
    for (const item of RETAILER_NAVIGATION) {
      expect(RETAILER_NAVIGATION_GROUPS).toContain(item.group);
    }
  });

  it('keeps durable IDs independent from display labels', () => {
    expect(
      RETAILER_NAVIGATION.find((item) => item.id === 'products')
    ).toMatchObject({
      label: 'Product Catalog',
      href: '/retailer-mvp/products',
    });

    expect(
      RETAILER_NAVIGATION.find((item) => item.id === 'documentation')
    ).toMatchObject({
      label: 'Help Center',
      href: '/retailer-mvp/documentation',
    });
  });

  it('validates functional area identifiers', () => {
    expect(isRetailerFunctionalArea('dashboard')).toBe(true);
    expect(isRetailerFunctionalArea('qrManagement')).toBe(true);
    expect(isRetailerFunctionalArea('notARealArea')).toBe(false);
    expect(isRetailerFunctionalArea(null)).toBe(false);
  });

  it('validates sidebar access arrays and rejects duplicates or unknown IDs', () => {
    expect(
      isSidebarAccess(['dashboard', 'products', 'qrManagement'])
    ).toBe(true);

    expect(isSidebarAccess([])).toBe(true);

    expect(
      isSidebarAccess(['dashboard', 'dashboard'])
    ).toBe(false);

    expect(
      isSidebarAccess(['dashboard', 'unknown'])
    ).toBe(false);

    expect(isSidebarAccess('dashboard')).toBe(false);
  });
});
