import { RetailMediaPartnerMembershipSchema } from './retail-media-partner-membership';

const timestamp = {
  seconds: 1,
  nanoseconds: 0,
};

describe('RetailMediaPartnerMembershipSchema', () => {
  it('accepts a valid retailer-specific Partner membership', () => {
    const result = RetailMediaPartnerMembershipSchema.parse({
      membershipId: 'membership_1',
      uid: 'nike_user_1',
      retailerId: 'retailer_a',
      partnerId: 'partner_nike',
      status: 'ACTIVE',
      permissions: {
        viewRetailMedia: true,
        exportRetailMedia: false,
      },
      createdAt: timestamp,
      createdBy: 'retailer_admin_1',
      updatedAt: timestamp,
      updatedBy: 'retailer_admin_1',
    });

    expect(result.uid).toBe('nike_user_1');
    expect(result.retailerId).toBe('retailer_a');
    expect(result.partnerId).toBe('partner_nike');
    expect(result.permissions.viewRetailMedia).toBe(true);
  });

  it('requires explicit Partner permissions', () => {
    expect(() =>
      RetailMediaPartnerMembershipSchema.parse({
        membershipId: 'membership_1',
        uid: 'nike_user_1',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        status: 'ACTIVE',
        permissions: {
          viewRetailMedia: true,
        },
        createdAt: timestamp,
        createdBy: 'retailer_admin_1',
        updatedAt: timestamp,
        updatedBy: 'retailer_admin_1',
      })
    ).toThrow();
  });

  it('rejects a membership without a Partner identity', () => {
    expect(() =>
      RetailMediaPartnerMembershipSchema.parse({
        membershipId: 'membership_1',
        uid: 'nike_user_1',
        retailerId: 'retailer_a',
        partnerId: '',
        status: 'ACTIVE',
        permissions: {
          viewRetailMedia: true,
          exportRetailMedia: false,
        },
        createdAt: timestamp,
        createdBy: 'retailer_admin_1',
        updatedAt: timestamp,
        updatedBy: 'retailer_admin_1',
      })
    ).toThrow();
  });

  it('rejects an unsupported membership status', () => {
    expect(() =>
      RetailMediaPartnerMembershipSchema.parse({
        membershipId: 'membership_1',
        uid: 'nike_user_1',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        status: 'SUSPENDED',
        permissions: {
          viewRetailMedia: true,
          exportRetailMedia: false,
        },
        createdAt: timestamp,
        createdBy: 'retailer_admin_1',
        updatedAt: timestamp,
        updatedBy: 'retailer_admin_1',
      })
    ).toThrow();
  });
});
