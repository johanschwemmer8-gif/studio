'use server';

import { validateProductImportRow, type ProductImportValidationOptions } from './product-import-validator';
import { classifyProductImportDuplicate } from './product-import-duplicates';
import type {
  ProductImportIssue,
  ProductImportRowStatus,
  ProductImportDuplicateClassification,
  ProductImportPreviewRow,
  ProductImportPreviewResult,
} from '@/types/importer/product-import';

export type ProductImportPreviewInput = {
  rowNumber: number;
  mapped: Record<string, unknown>;
};

export async function previewProductImportRows(
  retailerId: string,
  rows: ProductImportPreviewInput[],
  options: ProductImportValidationOptions = {}
): Promise<ProductImportPreviewResult> {
  const previewRows: ProductImportPreviewRow[] = [];

  for (const row of rows) {
    const validation = validateProductImportRow(row.mapped, options);

    if (validation.status === "REJECTED" || validation.data === undefined) {
      previewRows.push({
        rowNumber: row.rowNumber,
        mapped: row.mapped,
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

    if (duplicate.classification === "DUPLICATE") {
      if (duplicate.issues.some((issue) => issue.code === "INVALID_ROW")) {
        previewRows.push({
          rowNumber: row.rowNumber,
          mapped: row.mapped,
          status: "REJECTED",
          duplicateClassification: "DUPLICATE",
          issues,
          validatedData: validation.data,
        });
        continue;
      }

      previewRows.push({
        rowNumber: row.rowNumber,
        mapped: row.mapped,
        status: "DUPLICATE",
        duplicateClassification: "DUPLICATE",
        issues,
        validatedData: validation.data,
      });
      continue;
    }

    if (duplicate.classification === 'UPDATE') {
      previewRows.push({
        rowNumber: row.rowNumber,
        mapped: row.mapped,
        status: 'REJECTED',
        duplicateClassification: 'UPDATE',
        issues,
        validatedData: validation.data,
      });
      continue;
    }

    previewRows.push({
      rowNumber: row.rowNumber,
      mapped: row.mapped,
      status: validation.status,
      duplicateClassification: 'NEW',
      issues,
      validatedData: validation.data,
    });
  }

  return {
    rows: previewRows,
    totalRows: previewRows.length,
    validRows: previewRows.filter((row) => row.status === 'VALID').length,
    warningRows: previewRows.filter((row) => row.status === 'WARNING').length,
    rejectedRows: previewRows.filter((row) => row.status === 'REJECTED').length,
    duplicateRows: previewRows.filter((row) => row.status === 'DUPLICATE').length,
  };
}
