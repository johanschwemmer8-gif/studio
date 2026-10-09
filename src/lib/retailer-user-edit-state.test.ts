import {
  authorizationScopesEqual,
  initialSidebarAccessForEdit,
} from './retailer-user-edit-state';
import { RETAILER_FUNCTIONAL_AREA_IDS } from './retailer-navigation';

describe('retailer user edit state', () => {
  test('identical authorization scopes are equal', () => {
    const scope = {
      level: 'store' as const,
      networkId: 'network-1',
      brandId: 'brand-1',
      divisionId: 'division-1',
      regionId: 'region-1',
      areaId: 'area-1',
      storeId: 'store-1',
    };

    expect(authorizationScopesEqual(scope, { ...scope })).toBe(true);
  });

  test('same-level sibling scopes are not equal', () => {
    const actorScope = {
      level: 'store' as const,
      networkId: 'network-1',
      brandId: 'brand-1',
      divisionId: 'division-1',
      regionId: 'region-1',
      areaId: 'area-1',
      storeId: 'store-1',
    };

    const siblingScope = {
      ...actorScope,
      storeId: 'store-2',
    };

    expect(
      authorizationScopesEqual(actorScope, siblingScope)
    ).toBe(false);
  });

  test('legacy access expands to role-eligible canonical areas', () => {
    const result = initialSidebarAccessForEdit(
      'storeUser',
      undefined
    );

    expect(result).toHaveLength(
      RETAILER_FUNCTIONAL_AREA_IDS.length - 1
    );
    expect(result).not.toContain('userAccess');
  });

  test('legacy access includes User Access when role can manage users', () => {
    const result = initialSidebarAccessForEdit(
      'storeManager',
      undefined
    );

    expect(result).toHaveLength(
      RETAILER_FUNCTIONAL_AREA_IDS.length
    );
    expect(result).toContain('userAccess');
  });

  test('explicit zero access remains explicit zero access', () => {
    expect(
      initialSidebarAccessForEdit('storeManager', [])
    ).toEqual([]);
  });

  test('explicit assignments remain reductive under role ceiling', () => {
    expect(
      initialSidebarAccessForEdit(
        'storeUser',
        ['dashboard', 'userAccess']
      )
    ).toEqual(['dashboard']);
  });
});
