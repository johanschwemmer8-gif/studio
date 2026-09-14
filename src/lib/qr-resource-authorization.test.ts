import type { AuthorizedContext } from './auth-types';
import {
  canAccessQrStoreResource,
  requireQrStoreResourceAccess,
} from './qr-resource-authorization';

function actor(
  scope: AuthorizedContext['scope']
): AuthorizedContext {
  return {
    uid: 'user-1',
    retailerId: 'retailer-1',
    role: scope.level === 'store' ? 'storeManager' : 'networkAdmin',
    scope,
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
  };
}

describe('QR store resource authorization', () => {
  it('allows network scope after retailer tenancy has been established', () => {
    const networkActor = actor({
      level: 'network',
      networkId: 'retailer-1',
    });

    expect(
      canAccessQrStoreResource(networkActor, 'store-b')
    ).toBe(true);
  });

  it('allows a store actor to access its own store', () => {
    const storeActor = actor({
      level: 'store',
      networkId: 'retailer-1',
      brandId: 'brand-1',
      divisionId: 'division-1',
      regionId: 'region-1',
      areaId: 'area-1',
      storeId: 'store-a',
    });

    expect(
      canAccessQrStoreResource(storeActor, 'store-a')
    ).toBe(true);
  });

  it('denies a store actor access to another store in the same retailer', () => {
    const storeActor = actor({
      level: 'store',
      networkId: 'retailer-1',
      brandId: 'brand-1',
      divisionId: 'division-1',
      regionId: 'region-1',
      areaId: 'area-1',
      storeId: 'store-a',
    });

    expect(
      canAccessQrStoreResource(storeActor, 'store-b')
    ).toBe(false);

    expect(() =>
      requireQrStoreResourceAccess(storeActor, 'store-b')
    ).toThrow('ACCESS_DENIED');
  });

  it('fails closed for unresolved intermediate hierarchy scopes', () => {
    const regionalActor = actor({
      level: 'region',
      networkId: 'retailer-1',
      brandId: 'brand-1',
      divisionId: 'division-1',
      regionId: 'region-1',
    });

    expect(
      canAccessQrStoreResource(regionalActor, 'store-a')
    ).toBe(false);
  });
});
