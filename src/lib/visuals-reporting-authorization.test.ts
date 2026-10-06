import type { AuthorizationScope } from './auth-types';
import type { OrganizationScope } from './organization-scope-server';

import {
  assertReportingScopeAuthorized,
  canonicalizeReportingScope,
  isReportingScopeWithinAuthorizedScope,
} from './visuals-reporting-authorization';

const regionalHome: AuthorizationScope = {
  level: 'region',
  networkId: 'network-1',
  brandId: 'brand-1',
  divisionId: 'division-1',
  regionId: 'region-free-state',
};

const networkHome: AuthorizationScope = {
  level: 'network',
  networkId: 'network-1',
};

describe('Visuals & Reporting brand-boundary authorization', () => {
  it('allows the authenticated home scope', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(regionalHome, {
        ...regionalHome,
      }),
    ).toBe(true);
  });

  it('allows a descendant inside the same brand', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(regionalHome, {
        level: 'store',
        networkId: 'network-1',
        brandId: 'brand-1',
        divisionId: 'division-1',
        regionId: 'region-free-state',
        areaId: 'area-bloemfontein',
        storeId: 'store-014',
      }),
    ).toBe(true);
  });

  it('allows the whole authorised brand from a lower home scope', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(regionalHome, {
        level: 'brand',
        networkId: 'network-1',
        brandId: 'brand-1',
      }),
    ).toBe(true);
  });

  it('allows a sibling region inside the same brand', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(regionalHome, {
        level: 'region',
        networkId: 'network-1',
        brandId: 'brand-1',
        divisionId: 'division-other',
        regionId: 'region-gauteng',
      }),
    ).toBe(true);
  });

  it('allows a store elsewhere inside the same brand', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(regionalHome, {
        level: 'store',
        networkId: 'network-1',
        brandId: 'brand-1',
        divisionId: 'division-other',
        regionId: 'region-other',
        areaId: 'area-other',
        storeId: 'store-other',
      }),
    ).toBe(true);
  });

  it('rejects a sister-company brand for a brand-bound user', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(regionalHome, {
        level: 'brand',
        networkId: 'network-1',
        brandId: 'brand-2',
      }),
    ).toBe(false);
  });

  it('rejects network aggregation for a brand-bound user', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(regionalHome, {
        level: 'network',
        networkId: 'network-1',
      }),
    ).toBe(false);
  });

  it('rejects a different network', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(regionalHome, {
        level: 'brand',
        networkId: 'network-2',
        brandId: 'brand-1',
      }),
    ).toBe(false);
  });

  it('allows a network-scoped user to select a brand in its network', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(networkHome, {
        level: 'brand',
        networkId: 'network-1',
        brandId: 'brand-2',
      }),
    ).toBe(true);
  });

  it('allows a network-scoped user to report on a unit inside its network', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(networkHome, {
        level: 'store',
        networkId: 'network-1',
        brandId: 'brand-2',
        divisionId: 'division-2',
        regionId: 'region-2',
        areaId: 'area-2',
        storeId: 'store-2',
      }),
    ).toBe(true);
  });

  it('rejects network aggregation even for a network-scoped user', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(networkHome, {
        level: 'network',
        networkId: 'network-1',
      }),
    ).toBe(false);
  });

  it('rejects a different network for a network-scoped user', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(networkHome, {
        level: 'brand',
        networkId: 'network-2',
        brandId: 'brand-2',
      }),
    ).toBe(false);
  });

  it('fails closed when a requested reporting scope has no brand identity', () => {
    expect(
      isReportingScopeWithinAuthorizedScope(regionalHome, {
        level: 'region',
        networkId: 'network-1',
        regionId: 'region-free-state',
      }),
    ).toBe(false);
  });

  it('throws the canonical access-denied error across sister companies', () => {
    expect(() =>
      assertReportingScopeAuthorized(regionalHome, {
        level: 'brand',
        networkId: 'network-1',
        brandId: 'brand-2',
      }),
    ).toThrow('VISUALS_REPORTING_SCOPE_ACCESS_DENIED');
  });
});

describe('Visuals & Reporting requested scope canonicalization', () => {
  it('supplies only reporting-boundary ancestry and never injects operational home ancestry', () => {
    const requested: OrganizationScope = {
      level: 'region',
      regionId: 'region-peer',
    };

    expect(
      canonicalizeReportingScope(regionalHome, requested),
    ).toEqual({
      level: 'region',
      networkId: 'network-1',
      brandId: 'brand-1',
      regionId: 'region-peer',
    });
  });

  it('never overwrites conflicting browser-supplied network identity', () => {
    const requested: OrganizationScope = {
      level: 'store',
      networkId: 'network-hostile',
      brandId: 'brand-1',
      divisionId: 'division-1',
      regionId: 'region-free-state',
      areaId: 'area-bloemfontein',
      storeId: 'store-014',
    };

    const canonical = canonicalizeReportingScope(
      regionalHome,
      requested,
    );

    expect(canonical.networkId).toBe('network-hostile');

    expect(
      isReportingScopeWithinAuthorizedScope(
        regionalHome,
        canonical,
      ),
    ).toBe(false);
  });

  it('never replaces an explicitly requested sister-company brand', () => {
    const requested: OrganizationScope = {
      level: 'brand',
      networkId: 'network-1',
      brandId: 'brand-2',
    };

    const canonical = canonicalizeReportingScope(
      regionalHome,
      requested,
    );

    expect(canonical.brandId).toBe('brand-2');

    expect(
      isReportingScopeWithinAuthorizedScope(
        regionalHome,
        canonical,
      ),
    ).toBe(false);
  });
});
