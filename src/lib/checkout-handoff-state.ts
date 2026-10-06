import type { Basket } from '@/lib/schemas/basket';
import type { CheckoutHandoff } from '@/lib/schemas/checkout-handoff';

export function assertBasketReadyForCheckout(basket: Basket) {
  if (basket.status !== 'ACTIVE') {
    throw new Error('BASKET_NOT_ACTIVE');
  }

  if (basket.items.length === 0) {
    throw new Error('BASKET_EMPTY');
  }
}

export function assertCheckoutHandoffAuthority(
  handoff: CheckoutHandoff,
  basket: Basket
) {
  if (
    handoff.basketId !== basket.basketId ||
    handoff.sessionId !== basket.sessionId ||
    handoff.retailerId !== basket.retailerId ||
    handoff.environment !== basket.environment
  ) {
    throw new Error('CHECKOUT_HANDOFF_AUTHORITY_MISMATCH');
  }
}

export function isCheckoutHandoffExpired(
  handoff: CheckoutHandoff,
  nowSeconds: number
) {
  return handoff.expiresAt.seconds <= nowSeconds;
}

export function isReusableCheckoutHandoff(
  handoff: CheckoutHandoff,
  basket: Basket,
  nowSeconds: number
) {
  assertCheckoutHandoffAuthority(handoff, basket);

  return (
    handoff.status === 'READY' &&
    !isCheckoutHandoffExpired(handoff, nowSeconds)
  );
}
