import type { Basket, BasketItem } from '@/lib/schemas/basket';

export type BasketAuthority = {
  sessionId: string;
  retailerId: string;
  environment: Basket['environment'];
};

export function assertBasketAuthority(
  basket: Basket,
  authority: BasketAuthority
) {
  if (
    basket.sessionId !== authority.sessionId ||
    basket.retailerId !== authority.retailerId ||
    basket.environment !== authority.environment
  ) {
    throw new Error('BASKET_AUTHORITY_MISMATCH');
  }
}

export function assertBasketMutable(basket: Basket) {
  if (basket.status !== 'ACTIVE') {
    throw new Error('BASKET_NOT_MUTABLE');
  }
}

export function addOrIncrementBasketItem(
  items: BasketItem[],
  item: BasketItem
): BasketItem[] {
  const existingIndex = items.findIndex(
    (existing) => existing.gtin === item.gtin
  );

  if (existingIndex < 0) {
    return [...items, item];
  }

  return items.map((existing, index) =>
    index === existingIndex
      ? { ...existing, quantity: existing.quantity + item.quantity }
      : existing
  );
}

export function setBasketItemQuantity(
  items: BasketItem[],
  gtin: string,
  quantity: number
): BasketItem[] {
  if (!items.some((item) => item.gtin === gtin)) {
    throw new Error('BASKET_ITEM_NOT_FOUND');
  }

  return items.map((item) =>
    item.gtin === gtin ? { ...item, quantity } : item
  );
}

export function removeBasketItem(
  items: BasketItem[],
  gtin: string
): BasketItem[] {
  if (!items.some((item) => item.gtin === gtin)) {
    throw new Error('BASKET_ITEM_NOT_FOUND');
  }

  return items.filter((item) => item.gtin !== gtin);
}
