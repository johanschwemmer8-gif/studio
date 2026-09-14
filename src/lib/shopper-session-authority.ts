/**
 * Canonical authority boundary for shopper interaction persistence.
 *
 * The Shopper Session is authoritative for session and retailer identity.
 * GTIN remains product context only.
 */
export type ShopperSessionAuthorityInput = {
  requestedSessionId: string;
  requestedRetailerId?: string;
  requestedGtin?: string;
  session: {
    sessionId: string;
    retailerId: string;
    entryGtin?: string;
    shopperId?: string;
  };
};

export type ShopperSessionAuthority = {
  sessionId: string;
  retailerId: string;
  gtin: string;
  shopperId: string;
};

export function deriveShopperSessionAuthority(
  input: ShopperSessionAuthorityInput
): ShopperSessionAuthority {
  const { session } = input;

  if (session.sessionId !== input.requestedSessionId) {
    throw new Error('SESSION_INTEGRITY_ERROR');
  }

  if (
    input.requestedRetailerId &&
    input.requestedRetailerId !== session.retailerId
  ) {
    throw new Error('SESSION_RETAILER_MISMATCH');
  }

  if (
    input.requestedGtin &&
    session.entryGtin &&
    input.requestedGtin !== session.entryGtin
  ) {
    throw new Error('SESSION_GTIN_MISMATCH');
  }

  return {
    sessionId: session.sessionId,
    retailerId: session.retailerId,
    gtin: input.requestedGtin || session.entryGtin || '00000000000000',
    shopperId: session.shopperId || 'guest'
  };
}
