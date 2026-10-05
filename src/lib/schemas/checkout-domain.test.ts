import { BasketSchema } from './basket';
import { CheckoutHandoffSchema } from './checkout-handoff';

const timestamp = {
  seconds: 1_700_000_000,
  nanoseconds: 0,
};

describe('Checkout Sync canonical domain schemas', () => {
  it('accepts a valid canonical anonymous basket', () => {
    const result = BasketSchema.safeParse({
      basketId: 'basket_test_001',
      sessionId: 'sess_test_001',
      retailerId: 'retailer_test_001',
      environment: 'TEST',
      items: [
        {
          gtin: '06001234567890',
          quantity: 2,
          productName: 'Test Product',
          displayedUnitPrice: 49.99,
        },
      ],
      status: 'ACTIVE',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(result.success).toBe(true);
  });

  it('rejects basket items with a non-positive quantity', () => {
    const result = BasketSchema.safeParse({
      basketId: 'basket_test_001',
      sessionId: 'sess_test_001',
      retailerId: 'retailer_test_001',
      environment: 'TEST',
      items: [
        {
          gtin: '06001234567890',
          quantity: 0,
        },
      ],
      status: 'ACTIVE',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a basket without canonical session authority', () => {
    const result = BasketSchema.safeParse({
      basketId: 'basket_test_001',
      retailerId: 'retailer_test_001',
      environment: 'TEST',
      items: [],
      status: 'ACTIVE',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(result.success).toBe(false);
  });

  it('rejects legacy basket lifecycle status', () => {
    const result = BasketSchema.safeParse({
      basketId: 'basket_test_001',
      sessionId: 'sess_test_001',
      retailerId: 'retailer_test_001',
      environment: 'TEST',
      items: [],
      status: 'paid',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid checkout handoff', () => {
    const result = CheckoutHandoffSchema.safeParse({
      checkoutHandoffId: 'handoff_test_001',
      basketId: 'basket_test_001',
      sessionId: 'sess_test_001',
      retailerId: 'retailer_test_001',
      environment: 'TEST',
      status: 'READY',
      createdAt: timestamp,
      expiresAt: {
        seconds: timestamp.seconds + 300,
        nanoseconds: 0,
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a checkout handoff without retailer authority', () => {
    const result = CheckoutHandoffSchema.safeParse({
      checkoutHandoffId: 'handoff_test_001',
      basketId: 'basket_test_001',
      sessionId: 'sess_test_001',
      environment: 'TEST',
      status: 'READY',
      createdAt: timestamp,
      expiresAt: timestamp,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid checkout handoff lifecycle status', () => {
    const result = CheckoutHandoffSchema.safeParse({
      checkoutHandoffId: 'handoff_test_001',
      basketId: 'basket_test_001',
      sessionId: 'sess_test_001',
      retailerId: 'retailer_test_001',
      environment: 'TEST',
      status: 'PAID',
      createdAt: timestamp,
      expiresAt: timestamp,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid environment', () => {
    const result = CheckoutHandoffSchema.safeParse({
      checkoutHandoffId: 'handoff_test_001',
      basketId: 'basket_test_001',
      sessionId: 'sess_test_001',
      retailerId: 'retailer_test_001',
      environment: 'LIVE',
      status: 'READY',
      createdAt: timestamp,
      expiresAt: timestamp,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid Firestore timestamp', () => {
    const result = CheckoutHandoffSchema.safeParse({
      checkoutHandoffId: 'handoff_test_001',
      basketId: 'basket_test_001',
      sessionId: 'sess_test_001',
      retailerId: 'retailer_test_001',
      environment: 'TEST',
      status: 'READY',
      createdAt: timestamp,
      expiresAt: {
        seconds: timestamp.seconds + 300,
        nanoseconds: 1_000_000_000,
      },
    });

    expect(result.success).toBe(false);
  });
});
