'use server';

import { randomUUID } from 'crypto';

import { admin } from '@/lib/firebase-admin';
import { resolveBasketSessionAuthority } from '@/lib/basket-authority';
import { assertBasketAuthority } from '@/lib/basket-state';
import {
  assertBasketReadyForCheckout,
  assertCheckoutHandoffAuthority,
  isReusableCheckoutHandoff,
} from '@/lib/checkout-handoff-state';
import { BasketSchema, type Basket } from '@/lib/schemas/basket';
import {
  CheckoutHandoffSchema,
  type CheckoutHandoff,
} from '@/lib/schemas/checkout-handoff';
import {
  PrepareCheckoutHandoffInputSchema,
  type PrepareCheckoutHandoffInput,
} from '@/lib/schemas/checkout-handoff-command';

const CHECKOUT_HANDOFF_TTL_SECONDS = 300;

export type PrepareCheckoutHandoffOutput = {
  basket: Basket;
  handoff: CheckoutHandoff;
};

export async function prepareCheckoutHandoff(
  input: PrepareCheckoutHandoffInput
): Promise<PrepareCheckoutHandoffOutput> {
  const command = PrepareCheckoutHandoffInputSchema.parse(input);

  const { db, session } = await resolveBasketSessionAuthority(
    command.sessionId
  );

  const basketId = `basket_${session.sessionId}`;
  const basketRef = db.collection('baskets').doc(basketId);

  // One authoritative handoff slot per basket.
  const handoffRef = db
    .collection('checkoutHandoffs')
    .doc(basketId);

  return db.runTransaction(async (transaction) => {
    const [basketSnapshot, handoffSnapshot] = await Promise.all([
      transaction.get(basketRef),
      transaction.get(handoffRef),
    ]);

    if (!basketSnapshot.exists) {
      throw new Error('BASKET_NOT_FOUND');
    }

    const basket = BasketSchema.parse(basketSnapshot.data());

    if (basket.basketId !== basketId) {
      throw new Error('BASKET_INTEGRITY_ERROR');
    }

    assertBasketAuthority(basket, session);

    const now = admin.firestore.Timestamp.now();

    if (handoffSnapshot.exists) {
      const existingHandoff = CheckoutHandoffSchema.parse(
        handoffSnapshot.data()
      );

      assertCheckoutHandoffAuthority(existingHandoff, basket);

      if (
        isReusableCheckoutHandoff(
          existingHandoff,
          basket,
          now.seconds
        )
      ) {
        if (basket.status !== 'CHECKOUT_READY') {
          throw new Error('CHECKOUT_HANDOFF_STATE_MISMATCH');
        }

        return {
          basket,
          handoff: existingHandoff,
        };
      }
    }

    assertBasketReadyForCheckout(basket);

    const checkoutHandoffId = `handoff_${randomUUID()}`;

    const handoff = CheckoutHandoffSchema.parse({
      checkoutHandoffId,
      basketId: basket.basketId,
      sessionId: basket.sessionId,
      retailerId: basket.retailerId,
      environment: basket.environment,
      status: 'READY',
      createdAt: now,
      expiresAt: admin.firestore.Timestamp.fromMillis(
        now.toMillis() + CHECKOUT_HANDOFF_TTL_SECONDS * 1000
      ),
    });

    const updatedBasket = BasketSchema.parse({
      ...basket,
      status: 'CHECKOUT_READY',
      updatedAt: now,
    });

    transaction.set(handoffRef, handoff);
    transaction.set(basketRef, updatedBasket);

    return {
      basket: updatedBasket,
      handoff,
    };
  });
}
