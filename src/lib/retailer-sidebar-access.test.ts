import {
  RETAILER_FUNCTIONAL_AREA_IDS,
  RETAILER_NAVIGATION,
} from './retailer-navigation';
import {
  constrainSidebarAccessForRole,
  getRetailerSidebarAccessGroups,
  isRetailerSidebarAreaEligibleForRole,
} from './retailer-sidebar-access';

describe('Retailer Sidebar Access role ceiling', () => {
  test('derives all fifteen options from canonical retailer navigation', () => {
    const groups = getRetailerSidebarAccessGroups('networkAdmin');
    const options = groups.flatMap(group => group.options);

    expect(options).toHaveLength(15);
    expect(options.map(option => option.item.id)).toEqual(
      RETAILER_NAVIGATION.map(item => item.id)
    );
    expect(options.map(option => option.item.id)).toEqual(
      RETAILER_FUNCTIONAL_AREA_IDS
    );
  });

  test('preserves canonical navigation grouping and order', () => {
    const groups = getRetailerSidebarAccessGroups('networkAdmin');
    const flattened = groups.flatMap(group =>
      group.options.map(option => option.item)
    );

    expect(flattened).toEqual(RETAILER_NAVIGATION);
  });

  test('allows User Access only for roles with manageUsers authority', () => {
    expect(
      isRetailerSidebarAreaEligibleForRole(
        'networkAdmin',
        'userAccess'
      )
    ).toBe(true);

    expect(
      isRetailerSidebarAreaEligibleForRole(
        'storeManager',
        'userAccess'
      )
    ).toBe(true);

    expect(
      isRetailerSidebarAreaEligibleForRole(
        'storeUser',
        'userAccess'
      )
    ).toBe(false);

    expect(
      isRetailerSidebarAreaEligibleForRole(
        'analyst',
        'userAccess'
      )
    ).toBe(false);
  });

  test('does not invent role ceilings for other functional areas', () => {
    for (const area of RETAILER_FUNCTIONAL_AREA_IDS) {
      if (area === 'userAccess') continue;

      expect(
        isRetailerSidebarAreaEligibleForRole('storeUser', area)
      ).toBe(true);

      expect(
        isRetailerSidebarAreaEligibleForRole('analyst', area)
      ).toBe(true);
    }
  });

  test('removes ineligible assignments when role changes', () => {
    expect(
      constrainSidebarAccessForRole(
        'storeUser',
        ['dashboard', 'userAccess', 'products']
      )
    ).toEqual(['dashboard', 'products']);
  });

  test('never adds sidebar access while applying a role ceiling', () => {
    expect(
      constrainSidebarAccessForRole(
        'networkAdmin',
        ['dashboard']
      )
    ).toEqual(['dashboard']);

    expect(
      constrainSidebarAccessForRole(
        'analyst',
        []
      )
    ).toEqual([]);
  });

  test('marks ineligible User Access visibly instead of removing it', () => {
    const groups = getRetailerSidebarAccessGroups('analyst');
    const option = groups
      .flatMap(group => group.options)
      .find(candidate => candidate.item.id === 'userAccess');

    expect(option).toBeDefined();
    expect(option?.eligible).toBe(false);
    expect(option?.unavailableReason)
      .toBe('Not available for this role');
  });
});
