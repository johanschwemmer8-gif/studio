'use server';

import { getDb } from '@/lib/firebase-admin';
import type {
  ProductImportDuplicateClassification,
  ProductImportIssue,
} from '@/types/importer/product-import';

export type ProductImportDuplicateInput = {
  retailerId: string;
  gtin?: string;
  retailerSku?: string;
  barcode?: string;
};
export type ProductImportDuplicateMatch = {
  field: 'gtin' | 'retailerSku' | 'barcode';
  value: string;
  productId: string;
  firestoreId: string;
  retailerId: string;
};

export type ProductImportDuplicateResult = {
  classification: ProductImportDuplicateClassification;
  matches: ProductImportDuplicateMatch[];
  issues: ProductImportIssue[];
};
function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getProductId(
  data: Record<string, unknown>,
  firestoreId: string
): string {
  return clean(data.productId) || firestoreId;
}

function getRetailerId(data: Record<string, unknown>): string {
  return clean(data.retailerId);
}
async function findByField(
  field: 'gtin' | 'retailerSku' | 'barcode',
  value: string
): Promise<ProductImportDuplicateMatch[]> {
  const db = getDb();

  if (!db) {
    throw new Error('Product database is currently unavailable.');
  }

  const snapshot = await db
    .collection('products')
    .where(field, '==', value)
    .get();

  return snapshot.docs.map((productDoc) => {
    const data = productDoc.data() as Record<string, unknown>;

    return {
      field,
      value,
      productId: getProductId(data, productDoc.id),
      firestoreId: productDoc.id,
      retailerId: getRetailerId(data),
    };
  });
}
export async function classifyProductImportDuplicate(
  input: ProductImportDuplicateInput
): Promise<ProductImportDuplicateResult> {
  const retailerId = clean(input.retailerId);
  const gtin = clean(input.gtin);
  const retailerSku = clean(input.retailerSku);
  const barcode = clean(input.barcode);

  if (!retailerId) {
    return {
      classification: 'NEW',
      matches: [],
      issues: [{
        code: 'INVALID_ROW',
        severity: 'ERROR',
        message: 'Retailer identity is required for duplicate detection.',
      }],
    };
  }

  if (!gtin && !retailerSku && !barcode) {
    return {
      classification: 'NEW',
      matches: [],
      issues: [],
    };
  }

  const matches: ProductImportDuplicateMatch[] = [];

  if (gtin) {
    matches.push(...await findByField('gtin', gtin));
  }

  if (retailerSku) {
    const skuMatches = await findByField('retailerSku', retailerSku);
    matches.push(...skuMatches.filter(
      (match) => match.retailerId === retailerId
    ));
  }

  if (barcode) {
    const barcodeMatches = await findByField('barcode', barcode);
    matches.push(...barcodeMatches.filter(
      (match) => match.retailerId === retailerId
    ));
  }

  const uniqueMatches = Array.from(
    new Map(
      matches.map((match) => [
        `${match.firestoreId}:${match.field}`,
        match,
      ])
    ).values()
  );

  if (uniqueMatches.length === 0) {
    return {
      classification: 'NEW',
      matches: [],
      issues: [],
    };
  }

  const uniqueProducts = Array.from(
    new Set(uniqueMatches.map((match) => match.firestoreId))
  );

  if (uniqueProducts.length > 1) {
    return {
      classification: 'DUPLICATE',
      matches: uniqueMatches,
      issues: [{
        code: 'INVALID_ROW',
        severity: 'ERROR',
        message:
          'The supplied product identifiers match different existing products. Resolve the identifier conflict before importing.',
      }],
    };
  }

  return {
    classification: 'DUPLICATE',
    matches: uniqueMatches,
    issues: [{
      code: 'DUPLICATE_ROW',
      severity: 'ERROR',
      message:
        'A product with one or more of these identifiers already exists in the catalog.',
    }],
  };
}
