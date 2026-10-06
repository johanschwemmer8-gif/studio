'use server';

import { admin, getDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-server';
import {
  assertCheckoutHandoffAuthority,
  isCheckoutHandoffExpired,
} from '@/lib/checkout-handoff-state';
import { BasketSchema } from '@/lib/schemas/basket';
import { CheckoutHandoffSchema } from '@/lib/schemas/checkout-handoff';
import {
  ResolveCheckoutHandoffInputSchema,
  type ResolveCheckoutHandoffInput,
} from '@/lib/schemas/resolve-checkout-handoff-command';

export type ResolvedCheckoutItem = {
  gtin: string;
  quantity: number;
  productName?: string;
};

export type ResolveCheckoutHandoffOutput = {
  checkoutHandoffId: string;
  basketId: string;
  retailerId: string;
  status: 'RESOLVED';
  items: ResolvedCheckoutItem[];
};

export async function resolveCheckoutHandoff(
  input: ResolveCheckoutHandoffInput
): Promise<ResolveCheckoutHandoffOutput> {
  const command = ResolveCheckoutHandoffInputSchema.parse(input);

  const auth = await verifyAuth(command.idToken);

  if ('error' in auth) {
    throw new Error(auth.error);
  }

  const db = getDb();

  if (!db) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const handoffQuery = await db
    .collection('checkoutHandoffs')
    .where(
      'checkoutHandoffId',
      '==',
      command.checkoutHandoffId
    )
    .limit(2)
    .get();

  if (handoffQuery.empty) {
    throw new Error('CHECKOUT_HANDOFF_NOT_FOUND');
  }

  if (handoffQuery.size !== 1) {
    throw new Error('CHECKOUT_HANDOFF_INTEGRITY_ERROR');
  }

  const handoffDocument = handoffQuery.docs[0];
  const queriedHandoff = CheckoutHandoffSchema.parse(
    handoffDocument.data()
  );

  if (
    queriedHandoff.checkoutHandoffId !==
    command.checkoutHandoffId
  ) {
    throw new Error('CHECKOUT_HANDOFF_INTEGRITY_ERROR');
  }

  if (queriedHandoff.retailerId !== auth.retailerId) {
    throw new Error('ACCESS_DENIED: Tenant mismatch.');
  }

  if (queriedHandoff.status !== 'READY') {
    throw new Error('CHECKOUT_HANDOFF_NOT_READY');
  }

  const preflightNow = admin.firestore.Timestamp.now();

  if (
    isCheckoutHandoffExpired(
      queriedHandoff,
      preflightNow.seconds
    )
  ) {
    throw new Error('CHECKOUT_HANDOFF_EXPIRED');
  }

  const handoffRef = handoffDocument.ref;
  const basketRef = db
    .collection('baskets')
    .doc(queriedHandoff.basketId);

  return db.runTransaction(async (transaction) => {
    const [handoffSnapshot, basketSnapshot] =
      await Promise.all([
        transaction.get(handoffRef),
        transaction.get(basketRef),
      ]);

    if (!handoffSnapshot.exists) {
      throw new Error('CHECKOUT_HANDOFF_NOT_FOUND');
    }

    if (!basketSnapshot.exists) {
      throw new Error('BASKET_NOT_FOUND');
    }

    const handoff = CheckoutHandoffSchema.parse(
      handoffSnapshot.data()
    );
    const basket = BasketSchema.parse(
      basketSnapshot.data()
    );

    if (
      handoff.checkoutHandoffId !==
      command.checkoutHandoffId
    ) {
      throw new Error('CHECKOUT_HANDOFF_INTEGRITY_ERROR');
    }

    if (handoff.retailerId !== auth.retailerId) {
      throw new Error('ACCESS_DENIED: Tenant mismatch.');
    }

    assertCheckoutHandoffAuthority(handoff, basket);

    if (handoff.status !== 'READY') {
      throw new Error('CHECKOUT_HANDOFF_NOT_READY');
    }

    const now = admin.firestore.Timestamp.now();

    if (isCheckoutHandoffExpired(handoff, now.seconds)) {
      throw new Error('CHECKOUT_HANDOFF_EXPIRED');
    }

    if (basket.status !== 'CHECKOUT_READY') {
      throw new Error('BASKET_NOT_CHECKOUT_READY');
    }

    const resolvedHandoff = CheckoutHandoffSchema.parse({
      ...handoff,
      status: 'RESOLVED',
      resolvedAt: now,
    });

    const handedOffBasket = BasketSchema.parse({
      ...basket,
      status: 'HANDED_OFF',
      updatedAt: now,
    });

    transaction.set(handoffRef, resolvedHandoff);
    transaction.set(basketRef, handedOffBasket);

    return {
      checkoutHandoffId: resolvedHandoff.checkoutHandoffId,
      basketId: handedOffBasket.basketId,
      retailerId: handedOffBasket.retailerId,
      status: 'RESOLVED' as const,
      items: handedOffBasket.items.map((item) => ({
        gtin: item.gtin,
        quantity: item.quantity,
        ...(item.productName
          ? { productName: item.productName }
          : {}),
      })),
    };
  });
}
