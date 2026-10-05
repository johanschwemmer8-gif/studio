import { getDb } from '@/lib/firebase-admin';
import { ShopperSessionSchema } from '@/lib/schemas/shopper-session';
import { getCanonicalProduct } from '@/services/product-service';

export async function resolveBasketSessionAuthority(sessionId: string) {
  const db = getDb();

  if (!db) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const sessionSnapshot = await db
    .collection('sessions')
    .doc(sessionId)
    .get();

  if (!sessionSnapshot.exists) {
    throw new Error('SESSION_NOT_FOUND');
  }

  const session = ShopperSessionSchema.parse(sessionSnapshot.data());

  if (session.sessionId !== sessionId) {
    throw new Error('SESSION_INTEGRITY_ERROR');
  }

  return {
    db,
    session,
  };
}

export async function resolveBasketProductAuthority(
  sessionId: string,
  gtin: string
) {
  const { db, session } = await resolveBasketSessionAuthority(sessionId);

  const product = await getCanonicalProduct(gtin);

  if (!product) {
    throw new Error('PRODUCT_NOT_FOUND');
  }

  if (product.retailerId !== session.retailerId) {
    throw new Error('PRODUCT_RETAILER_MISMATCH');
  }

  return {
    db,
    session,
    product,
  };
}
