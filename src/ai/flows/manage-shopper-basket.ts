'use server';

import { admin } from '@/lib/firebase-admin';
import {
  resolveBasketProductAuthority,
  resolveBasketSessionAuthority,
} from '@/lib/basket-authority';
import {
  BasketSchema,
  type Basket,
  type BasketItem,
} from '@/lib/schemas/basket';
import {
  BasketCommandSchema,
  type BasketCommand,
} from '@/lib/schemas/basket-command';
import {
  addOrIncrementBasketItem,
  assertBasketAuthority,
  assertBasketMutable,
  removeBasketItem,
  setBasketItemQuantity,
} from '@/lib/basket-state';

export type ManageShopperBasketOutput = Basket | null;

export async function manageShopperBasket(
  input: BasketCommand
): Promise<ManageShopperBasketOutput> {
  const command = BasketCommandSchema.parse(input);
  const basketId = `basket_${command.sessionId}`;

  if (command.command === 'GET') {
    const { db, session } = await resolveBasketSessionAuthority(
      command.sessionId
    );

    const snapshot = await db.collection('baskets').doc(basketId).get();

    if (!snapshot.exists) {
      return null;
    }

    const basket = BasketSchema.parse(snapshot.data());

    if (basket.basketId !== basketId) {
      throw new Error('BASKET_INTEGRITY_ERROR');
    }

    assertBasketAuthority(basket, session);

    return basket;
  }

  if (command.command === 'ADD_ITEM') {
    const { db, session, product } = await resolveBasketProductAuthority(
      command.sessionId,
      command.gtin
    );

    const basketRef = db.collection('baskets').doc(basketId);

    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(basketRef);
      const now = admin.firestore.Timestamp.now();

      if (!snapshot.exists) {
        const item: BasketItem = {
          gtin: product.gtin,
          quantity: 1,
          ...(product.name ? { productName: product.name } : {}),
          ...(typeof product.price === 'number'
            ? { displayedUnitPrice: product.price }
            : {}),
        };

        const basket = BasketSchema.parse({
          basketId,
          sessionId: session.sessionId,
          retailerId: session.retailerId,
          environment: session.environment,
          items: [item],
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        });

        transaction.create(basketRef, basket);
        return basket;
      }

      const basket = BasketSchema.parse(snapshot.data());

      if (basket.basketId !== basketId) {
        throw new Error('BASKET_INTEGRITY_ERROR');
      }

      assertBasketAuthority(basket, session);
      assertBasketMutable(basket);

      const item: BasketItem = {
        gtin: product.gtin,
        quantity: 1,
        ...(product.name ? { productName: product.name } : {}),
        ...(typeof product.price === 'number'
          ? { displayedUnitPrice: product.price }
          : {}),
      };

      const items = addOrIncrementBasketItem(basket.items, item);

      const updated = BasketSchema.parse({
        ...basket,
        items,
        updatedAt: now,
      });

      transaction.set(basketRef, updated);
      return updated;
    });
  }

  const { db, session, product } = await resolveBasketProductAuthority(
    command.sessionId,
    command.gtin
  );

  const canonicalGtin = product.gtin;
  const basketRef = db.collection('baskets').doc(basketId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(basketRef);

    if (!snapshot.exists) {
      throw new Error('BASKET_NOT_FOUND');
    }

    const basket = BasketSchema.parse(snapshot.data());

    if (basket.basketId !== basketId) {
      throw new Error('BASKET_INTEGRITY_ERROR');
    }

    assertBasketAuthority(basket, session);
    assertBasketMutable(basket);

    const now = admin.firestore.Timestamp.now();

    if (command.command === 'SET_QUANTITY') {
      const updated = BasketSchema.parse({
        ...basket,
        items: setBasketItemQuantity(
          basket.items,
          canonicalGtin,
          command.quantity
        ),
        updatedAt: now,
      });

      transaction.set(basketRef, updated);
      return updated;
    }

    const items = removeBasketItem(
      basket.items,
      canonicalGtin
    );

    if (items.length === 0) {
      transaction.delete(basketRef);
      return null;
    }

    const updated = BasketSchema.parse({
      ...basket,
      items,
      updatedAt: now,
    });

    transaction.set(basketRef, updated);
    return updated;
  });
}
