import {
  RETAILER_FUNCTIONAL_AREA_IDS,
  RETAILER_NAVIGATION,
  RETAILER_NAVIGATION_GROUPS,
  isRetailerFunctionalArea,
  isSidebarAccess,
  resolveRetailerFunctionalArea,
  hasRetailerFunctionalAccess,
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


  it('resolves canonical routes and legitimate child routes to functional areas', () => {
    expect(resolveRetailerFunctionalArea('/retailer-mvp/dashboard'))
      .toBe('dashboard');

    expect(resolveRetailerFunctionalArea('/retailer-mvp/products/import'))
      .toBe('products');

    expect(resolveRetailerFunctionalArea('/retailer-mvp/qr-analytics'))
      .toBe('qrManagement');

    expect(
      resolveRetailerFunctionalArea(
        '/retailer-mvp/retail-media-partners/partner-123'
      )
    ).toBe('retailMediaPartners');

    expect(resolveRetailerFunctionalArea('/retailer-mvp/system-integration/pos'))
      .toBe('systemIntegration');

    expect(
      resolveRetailerFunctionalArea(
        '/retailer-mvp/ui-management/template-preview'
      )
    ).toBe('uiManagement');
  });

  it('leaves unresolved and legacy routes outside the functional access model', () => {
    expect(resolveRetailerFunctionalArea('/retailer-mvp')).toBeNull();
    expect(resolveRetailerFunctionalArea('/retailer-mvp/admin')).toBeNull();
    expect(resolveRetailerFunctionalArea('/retailer-mvp/ai-performance'))
      .toBeNull();
    expect(resolveRetailerFunctionalArea('/retailer-mvp/ai-policy'))
      .toBeNull();
    expect(resolveRetailerFunctionalArea('/retailer-mvp/brands')).toBeNull();
    expect(resolveRetailerFunctionalArea('/retailer-mvp/mobile-dashboard'))
      .toBeNull();
  });

  it('preserves legacy access only when sidebarAccess is absent', () => {
    expect(
      hasRetailerFunctionalAccess(undefined, 'dashboard')
    ).toBe(true);

    expect(
      hasRetailerFunctionalAccess([], 'dashboard')
    ).toBe(false);

    expect(
      hasRetailerFunctionalAccess(['dashboard'], 'dashboard')
    ).toBe(true);

    expect(
      hasRetailerFunctionalAccess(['dashboard'], 'products')
    ).toBe(false);
  });
});
