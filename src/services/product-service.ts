'use server';

/**
 * @fileOverview Authoritative Product Service for the iNteract platform.
 *
 * This is the canonical product persistence layer.
 *
 * Architecture:
 * Manual Product Entry ──┐
 *                        ├──> Canonical Product Service ──> Firestore
 * Bulk Product Import ───┘
 *
 * Firestore:
 * products/{canonical GTIN-14}
 */

import { admin, getDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-server';
import { parseGS1 } from '@/lib/gs1-parser';
import { type Product } from '@/lib/data';

export type ProductSource =
  | 'MANUAL'
  | 'BULK_IMPORT'
  | 'API'
  | 'SYSTEM';

export type ProductStatus =
  | 'DRAFT'
  | 'READY'
  | 'ACTIVE'
  | 'ARCHIVED';

export type ProductValidationStatus =
  | 'PENDING'
  | 'VALID'
  | 'INVALID';

export type ProductEnrichmentStatus =
  | 'NOT_STARTED'
  | 'PROCESSING'
  | 'COMPLETE'
  | 'FAILED';

export type CanonicalProductInput = {
  gtin?: string;
  barcode?: string;
  retailerId: string;
  name: string;
  brand?: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  currency?: string;
  promotionalPrice?: number;
  retailerSku?: string;
  department?: string;
  imageUrl?: string;
  source?: ProductSource;
};

export type CanonicalProductResult =
  | {
      success: true;
      product: Record<string, unknown>;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Creates a canonical iNteract product record.
 *
 * IMPORTANT:
 * - GTIN is validated when supplied.
 * - retailerId is resolved against the authenticated identity.
 * - iNteract generates a canonical internal productId.
 * - GTIN, retailerSku and barcode are retailer/product identifiers.
 * - Retailer-owned facts are stored as supplied.
 * - iNteract/system metadata is generated here.
 */
export async function createCanonicalProduct(
  input: CanonicalProductInput,
  idToken: string
): Promise<CanonicalProductResult> {
  if (!idToken) {
    return {
      success: false,
      error: 'Authentication required.'
    };
  }

  if (!input.retailerId) {
    return {
      success: false,
      error: 'Retailer identity is required.'
    };
  }

  try {
    const verifiedAuth = await verifyAuth(idToken);

    if (verifiedAuth.error || !verifiedAuth.uid) {
      return {
        success: false,
        error: verifiedAuth.error || 'Authentication failed.'
      };
    }

    const retailerId =
      verifiedAuth.role === 'admin'
        ? input.retailerId
        : verifiedAuth.retailerId;

    if (!retailerId || retailerId === 'unknown') {
      return {
        success: false,
        error: 'Account is not linked to a valid retailer.'
      };
    }

    if (
      verifiedAuth.role !== 'admin' &&
      verifiedAuth.retailerId !== input.retailerId
    ) {
      return {
        success: false,
        error: 'Access denied: retailer identity does not match your account.'
      };
    }

    const rawGtin = input.gtin?.replace(/\s+/g, '') || '';
    const identity = rawGtin ? parseGS1(rawGtin) : null;

    if (rawGtin && !identity) {
      return {
        success: false,
        error:
          'Invalid GTIN. Enter a valid GS1 GTIN-8, GTIN-12, GTIN-13 or GTIN-14 with a valid check digit.'
      };
    }

    const name = input.name?.trim();
    const category = input.category?.trim();

    if (!name) {
      return {
        success: false,
        error: 'Product name is required.'
      };
    }

    if (!category) {
      return {
        success: false,
        error: 'Product category is required.'
      };
    }

    if (
      typeof input.price !== 'number' ||
      !Number.isFinite(input.price) ||
      input.price < 0
    ) {
      return {
        success: false,
        error: 'Product price must be a valid number greater than or equal to zero.'
      };
    }

    const currency = (input.currency || 'ZAR').trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(currency)) {
      return {
        success: false,
        error: 'Currency must be a valid three-letter ISO currency code.'
      };
    }

    const db = getDb();

    if (!db) {
      return {
        success: false,
        error: 'Product database is currently unavailable.'
      };
    }

    // iNteract generates the canonical internal Product ID.
    const productId = `prod_${db.collection('products').doc().id}`;

    // Preserve the existing GTIN document-ID convention for backward
    // compatibility. GTIN-less products use the canonical Product ID.
    const productRef = identity
      ? db.collection('products').doc(identity.gtin)
      : db.collection('products').doc(productId);

    if (identity) {
      const existing = await productRef.get();

      if (existing.exists) {
        const existingData = existing.data();

        if (existingData?.retailerId !== retailerId) {
          return {
            success: false,
            error: 'This GTIN already belongs to another retailer.'
          };
        }

        return {
          success: false,
          error: 'This GTIN is already in your product catalog.'
        };
      }
    }

    const now = admin.firestore.Timestamp.now();

    const product: Record<string, unknown> = {
      productId,
      retailerId,

      name,
      category,

      price: Number(input.price.toFixed(2)),
      currency,

      

      status: 'READY' as ProductStatus,
      source: input.source || 'MANUAL',

      validation: {
        status: 'VALID' as ProductValidationStatus,
        warnings: [
          ...(input.description?.trim()
            ? []
            : ['Product description was not supplied.']),
          ...(identity
            ? []
            : ['GTIN was not supplied; GS1 validation was not performed.'])
        ],
        validatedAt: now
      },

      enrichment: {
        status: 'NOT_STARTED' as ProductEnrichmentStatus
      },

      createdAt: now,
      updatedAt: now,
    };

    /*
     * GTIN is optional. When supplied, it has already passed GS1 validation.
     */
    if (identity) {
      product.gtin = identity.gtin;

      product.gs1 = {
        originalFormat: `GTIN${rawGtin.length}`,
        checkDigitValid: true,
        validatedAt: now
      };
    }

    /*
     * Barcode is an optional retailer/product identifier.
     * It is intentionally not treated as a GTIN.
     */
    if (input.barcode?.trim()) {
      product.barcode = input.barcode.trim();
    }

    /*
     * Add retailer-owned optional fields only when supplied.
     * This avoids writing undefined values into Firestore.
     */
    if (input.brand?.trim()) {
      product.brand = input.brand.trim();
    }

    if (input.description?.trim()) {
      product.description = input.description.trim();
    }

    if (input.subcategory?.trim()) {
      product.subcategory = input.subcategory.trim();
    }

    if (input.promotionalPrice !== undefined) {
      if (
        !Number.isFinite(input.promotionalPrice) ||
        input.promotionalPrice < 0
      ) {
        return {
          success: false,
          error: 'Promotional price must be a valid number greater than or equal to zero.'
        };
      }

      product.promotionalPrice = Number(
        input.promotionalPrice.toFixed(2)
      );
    }

    if (input.retailerSku?.trim()) {
      product.retailerSku = input.retailerSku.trim();
    }

    if (input.department?.trim()) {
      product.department = input.department.trim();
    }

    if (input.imageUrl?.trim()) {
      product.imageUrl = input.imageUrl.trim();
    }

    /*
     * Audit fields use the verified Firebase UID.
     */
    product.createdBy = verifiedAuth.uid;
    product.updatedBy = verifiedAuth.uid;

    await productRef.set(product);

    return {
      success: true,
      product: {
        productId,
        retailerId,
        ...(identity ? { gtin: identity.gtin } : {}),
        ...(input.barcode?.trim()
          ? { barcode: input.barcode.trim() }
          : {}),
        ...(input.retailerSku?.trim()
          ? { retailerSku: input.retailerSku.trim() }
          : {}),
        name,
        category,
        price: Number(input.price.toFixed(2)),
        currency,
      }
    };
  } catch (error: any) {
    console.error(
      '[ProductService] Failed to create canonical product:',
      error
    );

    return {
      success: false,
      error: error?.message || 'Failed to create product.'
    };
  }
}

/**
 * Retrieves a canonical product by GTIN.
 *
 * Production rule:
 * Firestore is authoritative.
 * A missing Firestore product is NOT replaced with demo/mock data.
 */
export async function getCanonicalProduct(
  gtin: string
): Promise<Product | null> {
  if (!gtin) return null;

  const db = getDb();

  if (!db) {
    console.error(
      '[ProductService] Firestore unavailable while retrieving product.'
    );
    return null;
  }

  try {
    const identity = parseGS1(gtin);

    if (!identity) {
      return null;
    }

    const productDoc = await db
      .collection('products')
      .doc(identity.gtin)
      .get();

    if (!productDoc.exists) {
      return null;
    }

    const data = productDoc.data();

    if (!data) {
      return null;
    }

    return {
      gtin: data.gtin || identity.gtin,
      name: data.name || '',
      brand: data.brand || '',
      description: data.description || '',
      category: data.category || '',
      price: typeof data.price === 'number' ? data.price : 0,
      image: {
        src: data.imageUrl || data.image?.src || '',
        width: 600,
        height: 600
      },
      'data-ai-hint':
        data.enrichment?.aiHint ||
        data.category ||
        'product',
      batchNumber: data.batchNumber,
      serialNumber: data.serialNumber,
      retailerId: data.retailerId
    } as Product;
  } catch (error) {
    console.error(
      `[ProductService] Error retrieving GTIN ${gtin}:`,
      error
    );

    return null;
  }
}
