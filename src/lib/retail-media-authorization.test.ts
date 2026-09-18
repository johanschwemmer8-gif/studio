import type { RetailMediaPartnerMembership } from './schemas/retail-media-partner-membership';

import {
  canAccessRetailMediaPartnerResource,
  type RetailMediaPartnerResource,
} from './retail-media-authorization';

const timestamp = {
  seconds: 1,
  nanoseconds: 0,
};

function makeMembership(
  overrides: Partial<RetailMediaPartnerMembership> = {}
): RetailMediaPartnerMembership {
  return {
    membershipId: 'membership_nike_retailer_a',
    uid: 'nike_user',
    retailerId: 'retailer_a',
    partnerId: 'partner_nike',
    status: 'ACTIVE',
    permissions: {
      viewRetailMedia: true,
      exportRetailMedia: false,
    },
    createdAt: timestamp,
    createdBy: 'retailer_admin',
    updatedAt: timestamp,
    updatedBy: 'retailer_admin',
    ...overrides,
  };
}

function makeResource(
  overrides: Partial<RetailMediaPartnerResource> = {}
): RetailMediaPartnerResource {
  return {
    retailerId: 'retailer_a',
    partnerId: 'partner_nike',
    ...overrides,
  };
}

describe('canAccessRetailMediaPartnerResource', () => {
  it('allows an active Partner membership with permission to access its own resource', () => {
    const decision = canAccessRetailMediaPartnerResource(
      makeMembership(),
      makeResource(),
      'viewRetailMedia'
    );

    expect(decision).toEqual({
      allowed: true,
    });
  });

  it('DENIES Nike credentials attempting to access a Puma resource in the same retailer', () => {
    const decision = canAccessRetailMediaPartnerResource(
      makeMembership({
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
      }),
      makeResource({
        retailerId: 'retailer_a',
        partnerId: 'partner_puma',
      }),
      'viewRetailMedia'
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      'Retail Media resource belongs to a different Partner.'
    );
  });

  it('DENIES Nike at Retailer A attempting to access Nike at Retailer B', () => {
    const decision = canAccessRetailMediaPartnerResource(
      makeMembership({
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
      }),
      makeResource({
        retailerId: 'retailer_b',
        partnerId: 'partner_nike',
      }),
      'viewRetailMedia'
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      'Retail Media resource belongs to a different retailer.'
    );
  });

  it('denies an inactive Partner membership', () => {
    const decision = canAccessRetailMediaPartnerResource(
      makeMembership({
        status: 'INACTIVE',
      }),
      makeResource(),
      'viewRetailMedia'
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      'Retail Media Partner membership is inactive.'
    );
  });

  it('denies access when the required permission is not granted', () => {
    const decision = canAccessRetailMediaPartnerResource(
      makeMembership(),
      makeResource(),
      'exportRetailMedia'
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      'Retail Media Partner permission is not granted.'
    );
  });

  it('does not let a granted permission override Partner isolation', () => {
    const decision = canAccessRetailMediaPartnerResource(
      makeMembership({
        permissions: {
          viewRetailMedia: true,
          exportRetailMedia: true,
        },
      }),
      makeResource({
        partnerId: 'partner_puma',
      }),
      'exportRetailMedia'
    );

    expect(decision.allowed).toBe(false);
  });

  it('does not let a granted permission override retailer isolation', () => {
    const decision = canAccessRetailMediaPartnerResource(
      makeMembership({
        permissions: {
          viewRetailMedia: true,
          exportRetailMedia: true,
        },
      }),
      makeResource({
        retailerId: 'retailer_b',
      }),
      'exportRetailMedia'
    );

    expect(decision.allowed).toBe(false);
  });
});
