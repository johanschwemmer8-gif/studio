import {
  assertBasketReadyForCheckout,
  assertCheckoutHandoffAuthority,
  isCheckoutHandoffExpired,
  isReusableCheckoutHandoff,
} from '@/lib/checkout-handoff-state';
import type { Basket } from '@/lib/schemas/basket';
import type { CheckoutHandoff } from '@/lib/schemas/checkout-handoff';

const timestamp = {
  seconds: 1_700_000_000,
  nanoseconds: 0,
};

function makeBasket(overrides: Partial<Basket> = {}): Basket {
  return {
    basketId: 'basket_sess_123',
    sessionId: 'sess_123',
    retailerId: 'retailer_a',
    environment: 'PRODUCTION',
    items: [
      {
        gtin: '06009188000332',
        quantity: 2,
      },
    ],
    status: 'ACTIVE',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function makeHandoff(
  overrides: Partial<CheckoutHandoff> = {}
): CheckoutHandoff {
  return {
    checkoutHandoffId: 'handoff_123',
    basketId: 'basket_sess_123',
    sessionId: 'sess_123',
    retailerId: 'retailer_a',
    environment: 'PRODUCTION',
    status: 'READY',
    createdAt: timestamp,
    expiresAt: {
      seconds: timestamp.seconds + 300,
      nanoseconds: 0,
    },
    ...overrides,
  };
}

describe('Checkout handoff state authority', () => {
  it('accepts a non-empty ACTIVE basket for checkout', () => {
    expect(() => assertBasketReadyForCheckout(makeBasket())).not.toThrow();
  });

  it('rejects an empty basket', () => {
    expect(() =>
      assertBasketReadyForCheckout(makeBasket({ items: [] }))
    ).toThrow('BASKET_EMPTY');
  });

  it('rejects a basket that is not ACTIVE', () => {
    expect(() =>
      assertBasketReadyForCheckout(
        makeBasket({ status: 'CHECKOUT_READY' })
      )
    ).toThrow('BASKET_NOT_ACTIVE');
  });

  it('accepts matching handoff and basket authority', () => {
    expect(() =>
      assertCheckoutHandoffAuthority(makeHandoff(), makeBasket())
    ).not.toThrow();
  });

  it('rejects mismatched handoff retailer authority', () => {
    expect(() =>
      assertCheckoutHandoffAuthority(
        makeHandoff({ retailerId: 'retailer_b' }),
        makeBasket()
      )
    ).toThrow('CHECKOUT_HANDOFF_AUTHORITY_MISMATCH');
  });

  it('rejects mismatched handoff session authority', () => {
    expect(() =>
      assertCheckoutHandoffAuthority(
        makeHandoff({ sessionId: 'sess_other' }),
        makeBasket()
      )
    ).toThrow('CHECKOUT_HANDOFF_AUTHORITY_MISMATCH');
  });

  it('identifies an expired handoff', () => {
    expect(
      isCheckoutHandoffExpired(
        makeHandoff(),
        timestamp.seconds + 301
      )
    ).toBe(true);
  });

  it('does not expire a handoff before its expiry boundary', () => {
    expect(
      isCheckoutHandoffExpired(
        makeHandoff(),
        timestamp.seconds + 299
      )
    ).toBe(false);
  });

  it('reuses only a READY unexpired handoff', () => {
    expect(
      isReusableCheckoutHandoff(
        makeHandoff(),
        makeBasket(),
        timestamp.seconds + 100
      )
    ).toBe(true);

    expect(
      isReusableCheckoutHandoff(
        makeHandoff({ status: 'RESOLVED' }),
        makeBasket(),
        timestamp.seconds + 100
      )
    ).toBe(false);

    expect(
      isReusableCheckoutHandoff(
        makeHandoff(),
        makeBasket(),
        timestamp.seconds + 301
      )
    ).toBe(false);
  });
});
