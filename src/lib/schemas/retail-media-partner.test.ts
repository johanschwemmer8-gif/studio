import { RetailMediaPartnerSchema } from './retail-media-partner';

const timestamp = {
  seconds: 1,
  nanoseconds: 0,
};

describe('RetailMediaPartnerSchema', () => {
  it('accepts a valid retailer-specific Retail Media Partner', () => {
    const result = RetailMediaPartnerSchema.parse({
      partnerId: 'partner_nike',
      retailerId: 'retailer_a',
      name: 'Nike',
      status: 'ACTIVE',
      logoUrl: 'https://example.com/nike.png',
      websiteUrl: 'https://example.com/nike',
      createdAt: timestamp,
      createdBy: 'user_1',
      updatedAt: timestamp,
      updatedBy: 'user_1',
    });

    expect(result.partnerId).toBe('partner_nike');
    expect(result.retailerId).toBe('retailer_a');
    expect(result.status).toBe('ACTIVE');
  });

  it('accepts a Partner without optional presentation URLs', () => {
    const result = RetailMediaPartnerSchema.parse({
      partnerId: 'partner_nike',
      retailerId: 'retailer_a',
      name: 'Nike',
      status: 'ACTIVE',
      createdAt: timestamp,
      createdBy: 'user_1',
      updatedAt: timestamp,
      updatedBy: 'user_1',
    });

    expect(result.logoUrl).toBeUndefined();
    expect(result.websiteUrl).toBeUndefined();
  });

  it('rejects a blank stable Partner identity', () => {
    expect(() =>
      RetailMediaPartnerSchema.parse({
        partnerId: '   ',
        retailerId: 'retailer_a',
        name: 'Nike',
        status: 'ACTIVE',
        createdAt: timestamp,
        createdBy: 'user_1',
        updatedAt: timestamp,
        updatedBy: 'user_1',
      })
    ).toThrow();
  });

  it('rejects an invalid Partner URL', () => {
    expect(() =>
      RetailMediaPartnerSchema.parse({
        partnerId: 'partner_nike',
        retailerId: 'retailer_a',
        name: 'Nike',
        status: 'ACTIVE',
        logoUrl: 'not-a-url',
        createdAt: timestamp,
        createdBy: 'user_1',
        updatedAt: timestamp,
        updatedBy: 'user_1',
      })
    ).toThrow();
  });
});
