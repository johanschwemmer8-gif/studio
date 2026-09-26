'use server';

import { db } from '@/lib/firebase-admin';
import { resolveProductionQr } from '@/lib/qr-resolution';
import { getProductionQrResolverOrigin } from '@/lib/qr-resolver-url';
import { ShopperSessionSchema } from '@/lib/schemas/shopper-session';

export type ComparisonProductResult =
  | {
      success: true;
      product: {
        gtin: string;
        productId?: string;
        productName?: string;
      };
    }
  | {
      success: false;
      code:
        | 'INVALID_QR'
        | 'QR_UNAVAILABLE'
        | 'SESSION_UNAVAILABLE'
        | 'SESSION_INTEGRITY_ERROR'
        | 'RETAILER_MISMATCH'
        | 'PRODUCT_CONTEXT_UNAVAILABLE'
        | 'PRODUCT_CONTEXT_AMBIGUOUS'
        | 'SAME_PRODUCT';
      message: string;
    };

function extractProductionQrId(scannedValue: string): string | null {
  const value = scannedValue.trim();

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const productionOrigin = getProductionQrResolverOrigin(
      process.env.QR_RESOLVER_BASE_URL
    );

    /*
     * Comparison scanning accepts only canonical iNteract production
     * resolver URLs. The scanned URL is identity input only and is never
     * navigated to from the current shopper experience.
     */
    if (url.origin !== productionOrigin) {
      return null;
    }

    if (
      url.search !== '' ||
      url.hash !== '' ||
      url.username !== '' ||
      url.password !== ''
    ) {
      return null;
    }

    const match = url.pathname.match(/^\/resolve\/([^/]+)\/?$/);

    if (!match) {
      return null;
    }

    const qrCodeId = decodeURIComponent(match[1]).trim();

    return qrCodeId || null;
  } catch {
    return null;
  }
}

export async function resolveComparisonProduct(input: {
  scannedValue: string;
  sessionId: string;
}): Promise<ComparisonProductResult> {
  const qrCodeId = extractProductionQrId(input.scannedValue);

  if (!qrCodeId) {
    return {
      success: false,
      code: 'INVALID_QR',
      message: 'This is not a valid iNteract product QR code.',
    };
  }

  if (!input.sessionId.trim() || db == null) {
    return {
      success: false,
      code: 'SESSION_UNAVAILABLE',
      message:
        'Comparison is unavailable because the current shopper session could not be verified.',
    };
  }

  try {
    /*
     * The existing shopper session is the authority for the primary
     * experience. The browser does not assert retailer identity or the
     * primary product GTIN.
     */
    const sessionSnapshot = await db
      .collection('sessions')
      .doc(input.sessionId)
      .get();

    if (!sessionSnapshot.exists) {
      return {
        success: false,
        code: 'SESSION_UNAVAILABLE',
        message:
          'Comparison is unavailable because the current shopper session could not be verified.',
      };
    }

    const session = ShopperSessionSchema.parse(sessionSnapshot.data());

    if (
      session.sessionId !== input.sessionId ||
      session.environment !== 'PRODUCTION'
    ) {
      return {
        success: false,
        code: 'SESSION_INTEGRITY_ERROR',
        message:
          'Comparison is unavailable because the current shopper session is invalid.',
      };
    }

    /*
     * Resolve QR B read-only. This intentionally does NOT call
     * beginQrShopperSession and does NOT execute QR B's shopper-entry
     * destination. The existing Ari session remains primary.
     */
    const resolved = await resolveProductionQr(qrCodeId);

    if (resolved.qr.retailerId !== session.retailerId) {
      return {
        success: false,
        code: 'RETAILER_MISMATCH',
        message:
          'This product is not available in the current retail experience.',
      };
    }

    /*
     * Resolve Product B conservatively.
     *
     * A specific PRODUCT target may contribute productGtin, while
     * productContext may also contribute authoritative GTIN context.
     * Comparison proceeds only when these sources resolve to exactly one
     * distinct GTIN.
     */
    const productsByGtin = new Map<
      string,
      {
        gtin: string;
        productId?: string;
        productName?: string;
      }
    >();

    if (
      resolved.activation.target.level === 'PRODUCT' &&
      resolved.activation.target.productGtin
    ) {
      productsByGtin.set(resolved.activation.target.productGtin, {
        gtin: resolved.activation.target.productGtin,
      });
    }

    for (const context of resolved.activation.productContext ?? []) {
      const existing = productsByGtin.get(context.gtin);

      productsByGtin.set(context.gtin, {
        gtin: context.gtin,
        productId: context.productId ?? existing?.productId,
        productName: context.productName ?? existing?.productName,
      });
    }

    const products = Array.from(productsByGtin.values());

    if (products.length === 0) {
      return {
        success: false,
        code: 'PRODUCT_CONTEXT_UNAVAILABLE',
        message:
          'This QR does not identify a specific product that can be compared.',
      };
    }

    if (products.length !== 1) {
      return {
        success: false,
        code: 'PRODUCT_CONTEXT_AMBIGUOUS',
        message:
          'This activation contains more than one product. Choose a specific product before comparing.',
      };
    }

    const comparisonProduct = products[0];

    if (
      session.entryGtin &&
      comparisonProduct.gtin === session.entryGtin
    ) {
      return {
        success: false,
        code: 'SAME_PRODUCT',
        message:
          'Scan a different product to compare it with this one.',
      };
    }

    return {
      success: true,
      product: comparisonProduct,
    };
  } catch {
    return {
      success: false,
      code: 'QR_UNAVAILABLE',
      message:
        'This QR could not be resolved for comparison. Please try another product.',
    };
  }
}
