'use server';

import { verifyAuth } from '@/lib/auth-server';
import { createCanonicalProduct, type CanonicalProductInput } from '@/services/product-service';
import { validateProductImportRow } from './product-import-validator';
import { classifyProductImportDuplicate } from './product-import-duplicates';
import type { ProductImportIssue } from '@/types/importer/product-import';

export type ProductImportExecutionRow = {
  rowNumber: number;
  mapped: Record<string, unknown>;
};

export type ProductImportExecutionRowResult = {
  rowNumber: number;
  status: 'IMPORTED' | 'DUPLICATE' | 'REJECTED';
  issues: ProductImportIssue[];
  product?: Record<string, unknown>;
};

export type ProductImportExecutionResult = {
  rows: ProductImportExecutionRowResult[];
  importedRows: number;
  duplicateRows: number;
  rejectedRows: number;
};

export async function executeProductImport(
  idToken: string,
  requestedRetailerId: string,
  rows: ProductImportExecutionRow[]
): Promise<ProductImportExecutionResult> {
  const auth = await verifyAuth(idToken);

  if (auth.error || auth.uid === '') {
    throw new Error(auth.error || 'Authentication failed.');
  }

  const retailerId =
    auth.role === 'admin' ? requestedRetailerId : auth.retailerId;

  if (retailerId === undefined || retailerId === '' || retailerId === 'unknown') {
    throw new Error('Account is not linked to a valid retailer.');
  }

  if (auth.role !== 'admin' && auth.retailerId !== requestedRetailerId) {
    throw new Error('Access denied: retailer identity does not match your account.');
  }

  const results: ProductImportExecutionRowResult[] = [];

  for (const row of rows) {
    const validation = validateProductImportRow(row.mapped);

    if (validation.status === 'REJECTED' || validation.data === undefined) {
      results.push({
        rowNumber: row.rowNumber,
        status: 'REJECTED',
        issues: validation.issues,
      });
      continue;
    }

    const duplicate = await classifyProductImportDuplicate({
      retailerId,
      gtin: validation.data.gtin,
      retailerSku: validation.data.retailerSku,
      barcode: validation.data.barcode,
    });

    const issues = [...validation.issues, ...duplicate.issues];

    if (duplicate.issues.some((issue) => issue.code === 'INVALID_ROW')) {
      results.push({
        rowNumber: row.rowNumber,
        status: 'REJECTED',
        issues,
      });
      continue;
    }

    if (duplicate.classification === 'DUPLICATE') {
      results.push({
        rowNumber: row.rowNumber,
        status: 'DUPLICATE',
        issues,
      });
      continue;
    }

    if (duplicate.classification === 'UPDATE') {
      results.push({
        rowNumber: row.rowNumber,
        status: 'REJECTED',
        issues,
      });
      continue;
    }

    const input: CanonicalProductInput = {
      ...validation.data,
      retailerId,
      source: 'BULK_IMPORT',
    };

    const created = await createCanonicalProduct(input, idToken);

    if (created.success === false) {
      results.push({
        rowNumber: row.rowNumber,
        status: 'REJECTED',
        issues: [
          ...issues,
          {
            code: 'INVALID_ROW',
            severity: 'ERROR',
            message: created.error,
          },
        ],
      });
      continue;
    }

    results.push({
      rowNumber: row.rowNumber,
      status: 'IMPORTED',
      issues,
      product: created.product,
    });
  }

  return {
    rows: results,
    importedRows: results.filter((row) => row.status === 'IMPORTED').length,
    duplicateRows: results.filter((row) => row.status === 'DUPLICATE').length,
    rejectedRows: results.filter((row) => row.status === 'REJECTED').length,
  };
}
