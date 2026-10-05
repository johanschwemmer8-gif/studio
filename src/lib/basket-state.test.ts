import {
  addOrIncrementBasketItem,
  assertBasketAuthority,
  assertBasketMutable,
  removeBasketItem,
  setBasketItemQuantity,
} from '@/lib/basket-state';
import type { Basket } from '@/lib/schemas/basket';

const timestamp = {
  seconds: 1,
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
        quantity: 1,
        productName: 'Canonical Product',
        displayedUnitPrice: 100,
      },
    ],
    status: 'ACTIVE',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

describe('Checkout Sync basket state authority', () => {
  it('accepts matching session, retailer and environment authority', () => {
    expect(() =>
      assertBasketAuthority(makeBasket(), {
        sessionId: 'sess_123',
        retailerId: 'retailer_a',
        environment: 'PRODUCTION',
      })
    ).not.toThrow();
  });

  it('rejects retailer authority mismatch', () => {
    expect(() =>
      assertBasketAuthority(makeBasket(), {
        sessionId: 'sess_123',
        retailerId: 'retailer_b',
        environment: 'PRODUCTION',
      })
    ).toThrow('BASKET_AUTHORITY_MISMATCH');
  });

  it('rejects session authority mismatch', () => {
    expect(() =>
      assertBasketAuthority(makeBasket(), {
        sessionId: 'sess_other',
        retailerId: 'retailer_a',
        environment: 'PRODUCTION',
      })
    ).toThrow('BASKET_AUTHORITY_MISMATCH');
  });

  it('rejects environment authority mismatch', () => {
    expect(() =>
      assertBasketAuthority(makeBasket(), {
        sessionId: 'sess_123',
        retailerId: 'retailer_a',
        environment: 'TEST',
      })
    ).toThrow('BASKET_AUTHORITY_MISMATCH');
  });

  it('allows mutation only while basket is ACTIVE', () => {
    expect(() => assertBasketMutable(makeBasket())).not.toThrow();

    expect(() =>
      assertBasketMutable(makeBasket({ status: 'CHECKOUT_READY' }))
    ).toThrow('BASKET_NOT_MUTABLE');

    expect(() =>
      assertBasketMutable(makeBasket({ status: 'HANDED_OFF' }))
    ).toThrow('BASKET_NOT_MUTABLE');

    expect(() =>
      assertBasketMutable(makeBasket({ status: 'COMPLETED' }))
    ).toThrow('BASKET_NOT_MUTABLE');

    expect(() =>
      assertBasketMutable(makeBasket({ status: 'ABANDONED' }))
    ).toThrow('BASKET_NOT_MUTABLE');
  });

  it('increments quantity instead of duplicating an existing GTIN', () => {
    const result = addOrIncrementBasketItem(makeBasket().items, {
      gtin: '06009188000332',
      quantity: 1,
      productName: 'Canonical Product',
      displayedUnitPrice: 100,
    });

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(2);
  });

  it('adds a different GTIN as a separate basket line', () => {
    const result = addOrIncrementBasketItem(makeBasket().items, {
      gtin: '00012345678905',
      quantity: 1,
    });

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      gtin: '00012345678905',
      quantity: 1,
    });
  });

  it('sets quantity for an existing canonical GTIN', () => {
    const result = setBasketItemQuantity(
      makeBasket().items,
      '06009188000332',
      4
    );

    expect(result[0].quantity).toBe(4);
  });

  it('rejects quantity mutation for a missing GTIN', () => {
    expect(() =>
      setBasketItemQuantity(
        makeBasket().items,
        '00012345678905',
        2
      )
    ).toThrow('BASKET_ITEM_NOT_FOUND');
  });

  it('removes the requested canonical GTIN', () => {
    const result = removeBasketItem(
      makeBasket().items,
      '06009188000332'
    );

    expect(result).toEqual([]);
  });

  it('rejects removal of a missing GTIN', () => {
    expect(() =>
      removeBasketItem(
        makeBasket().items,
        '00012345678905'
      )
    ).toThrow('BASKET_ITEM_NOT_FOUND');
  });
});
