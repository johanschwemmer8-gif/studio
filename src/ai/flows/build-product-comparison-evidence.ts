'use server';

import { db } from '@/lib/firebase-admin';
import {
  resolveComparisonProduct,
} from '@/ai/flows/resolve-comparison-product';
import {
  collectProductEvidence,
} from '@/lib/product-evidence-orchestrator';
import {
  createProductionProductEvidenceProviders,
} from '@/lib/product-evidence-providers/production-product-evidence';
import {
  ProductComparisonEvidenceSchema,
  type ProductComparisonEvidence,
  type ProductEvidenceIdentity,
} from '@/lib/schemas/product-evidence';
import {
  ShopperSessionSchema,
} from '@/lib/schemas/shopper-session';

export type BuildProductComparisonEvidenceResult =
  | {
      success: true;
      evidence: ProductComparisonEvidence;
    }
  | {
      success: false;
      code:
        | 'COMPARISON_PRODUCT_UNAVAILABLE'
        | 'SESSION_UNAVAILABLE'
        | 'SESSION_INTEGRITY_ERROR'
        | 'PRIMARY_PRODUCT_UNAVAILABLE'
        | 'SAME_PRODUCT'
        | 'EVIDENCE_UNAVAILABLE';
      message: string;
    };

export async function buildProductComparisonEvidence(input: {
  scannedValue: string;
  sessionId: string;
}): Promise<BuildProductComparisonEvidenceResult> {
  if (!input.sessionId.trim() || db == null) {
    return {
      success: false,
      code: 'SESSION_UNAVAILABLE',
      message:
        'Comparison is unavailable because the current shopper session could not be verified.',
    };
  }

  /*
   * Product B must be resolved from the scanned production QR on the server.
   * The browser never supplies Product B identity as authority.
   */
  const comparisonResult = await resolveComparisonProduct({
    scannedValue: input.scannedValue,
    sessionId: input.sessionId,
  });

  if (!comparisonResult.success) {
    return {
      success: false,
      code: 'COMPARISON_PRODUCT_UNAVAILABLE',
      message: comparisonResult.message,
    };
  }

  try {
    /*
     * Reload the authoritative shopper session for Product A and retailer
     * tenancy. Presentation-state product identity is never trusted here.
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

    const session = ShopperSessionSchema.parse(
      sessionSnapshot.data()
    );

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

    if (!session.entryGtin) {
      return {
        success: false,
        code: 'PRIMARY_PRODUCT_UNAVAILABLE',
        message:
          'Comparison is unavailable because the current product could not be identified unambiguously.',
      };
    }

    if (
      session.entryGtin === comparisonResult.product.gtin
    ) {
      return {
        success: false,
        code: 'SAME_PRODUCT',
        message:
          'Scan a different product to compare it with this one.',
      };
    }

    const productAIdentity: ProductEvidenceIdentity = {
      gtin: session.entryGtin,
    };

    const productBIdentity: ProductEvidenceIdentity = {
      gtin: comparisonResult.product.gtin,
      ...(comparisonResult.product.productId
        ? {
            productId:
              comparisonResult.product.productId,
          }
        : {}),
      ...(comparisonResult.product.productName
        ? {
            productName:
              comparisonResult.product.productName,
          }
        : {}),
    };

    /*
     * Provider sets are intentionally separate and request-scoped.
     * Each product therefore performs at most one shared external discovery
     * operation across the five external evidence source classes.
     */
    const productAProviders =
      createProductionProductEvidenceProviders();

    const productBProviders =
      createProductionProductEvidenceProviders();

    const [productAResult, productBResult] =
      await Promise.all([
        collectProductEvidence(
          productAIdentity,
          {
            retailerId: session.retailerId,
          },
          productAProviders
        ),
        collectProductEvidence(
          productBIdentity,
          {
            retailerId: session.retailerId,
          },
          productBProviders
        ),
      ]);

    const evidence =
      ProductComparisonEvidenceSchema.parse({
        productA: productAResult.evidence,
        productB: productBResult.evidence,
      });

    return {
      success: true,
      evidence,
    };
  } catch {
    return {
      success: false,
      code: 'EVIDENCE_UNAVAILABLE',
      message:
        'Product comparison evidence is temporarily unavailable. Please try again.',
    };
  }
}
