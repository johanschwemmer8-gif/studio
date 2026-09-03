/**
 * Bulk Product Import Validator
 *
 * Validates mapped retailer product rows before they reach the
 * canonical product service.
 *
 * Responsibilities:
 * - Validate required retailer-supplied fields.
 * - Normalise safe textual/numeric input.
 * - Validate optional GTINs using the canonical GS1 parser.
 * - Keep barcode and retailer SKU distinct from GTIN.
 * - Produce warnings and blocking errors.
 * - Never generate product IDs.
 * - Never write to Firestore.
 */

import { parseGS1 } from '@/lib/gs1-parser';
import type {
  ProductImportIssue,
  ProductImportRowStatus,
} from '@/types/importer/product-import';

export type ProductImportMappedRow = Record<string, unknown>;

export type ProductImportValidationOptions = {
  defaultCurrency?: string;
};

export type ProductImportValidatedData = {
  name: string;
  category: string;
  price: number;
  currency: string;
  gtin?: string;
  barcode?: string;
  retailerSku?: string;
  brand?: string;
  description?: string;
  subcategory?: string;
  department?: string;
  promotionalPrice?: number;
  imageUrl?: string;
};

export type ProductImportValidationResult = {
  status: Extract<
    ProductImportRowStatus,
    'VALID' | 'WARNING' | 'REJECTED'
  >;
  data?: ProductImportValidatedData;
  issues: ProductImportIssue[];
};

function textValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function numericValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  // Deliberately reject currency symbols and ambiguous formatting.
  if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) return null;

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

function normaliseCurrency(
  value: unknown,
  defaultCurrency?: string
): {
  value?: string;
  issue?: ProductImportIssue;
} {
  const supplied = textValue(value);

  if (!supplied) {
    const fallback = textValue(defaultCurrency).toUpperCase();

    if (!fallback) {
      return {
        issue: {
          code: 'MISSING_REQUIRED_FIELD',
          severity: 'ERROR',
          field: 'currency',
          message:
            'Currency is required unless the retailer has a configured default currency.',
        },
      };
    }

    if (!/^[A-Z]{3}$/.test(fallback)) {
      return {
        issue: {
          code: 'INVALID_CURRENCY',
          severity: 'ERROR',
          field: 'currency',
          message:
            'The configured retailer default currency must be a three-letter ISO 4217 code.',
        },
      };
    }

    return { value: fallback };
  }

  const currency = supplied.toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    return {
      issue: {
        code: 'INVALID_CURRENCY',
        severity: 'ERROR',
        field: 'currency',
        message:
          'Currency must be a three-letter ISO 4217 code such as ZAR, USD or EUR.',
      },
    };
  }

  return { value: currency };
}

function addRequiredTextIssue(
  issues: ProductImportIssue[],
  field: string,
  value: string
): void {
  if (!value) {
    issues.push({
      code: 'MISSING_REQUIRED_FIELD',
      severity: 'ERROR',
      field,
      message: `${field} is required.`,
    });
  }
}

function addOptionalText(
  target: ProductImportValidatedData,
  field: keyof ProductImportValidatedData,
  value: unknown
): void {
  const text = textValue(value);

  if (text) {
    target[field] = text as never;
  }
}

export function validateProductImportRow(
  raw: ProductImportMappedRow,
  options: ProductImportValidationOptions = {}
): ProductImportValidationResult {
  const issues: ProductImportIssue[] = [];

  const name = textValue(raw.name);
  const category = textValue(raw.category);

  addRequiredTextIssue(issues, 'name', name);
  addRequiredTextIssue(issues, 'category', category);

  const price = numericValue(raw.price);

  if (price === null) {
    issues.push({
      code: 'INVALID_PRICE',
      severity: 'ERROR',
      field: 'price',
      message:
        'Price must be a valid numeric value such as 29.99. Do not include currency symbols.',
    });
  } else if (price < 0) {
    issues.push({
      code: 'INVALID_PRICE',
      severity: 'ERROR',
      field: 'price',
      message: 'Price cannot be negative.',
    });
  }

  const currencyResult = normaliseCurrency(
    raw.currency,
    options.defaultCurrency
  );

  if (currencyResult.issue) {
    issues.push(currencyResult.issue);
  }

  const data: ProductImportValidatedData = {
    name,
    category,
    price: price === null ? 0 : Number(price.toFixed(2)),
    currency: currencyResult.value || '',
  };

  /*
   * GTIN is optional.
   *
   * If supplied, it must pass the same canonical GS1 validation
   * used by manual product creation.
   */
  const rawGtin = textValue(raw.gtin).replace(/\s+/g, '');

  if (rawGtin) {
    const identity = parseGS1(rawGtin);

    if (!identity) {
      issues.push({
        code: 'INVALID_GTIN',
        severity: 'ERROR',
        field: 'gtin',
        message:
          'Invalid GTIN. Enter a valid GS1 GTIN-8, GTIN-12, GTIN-13 or GTIN-14 with a valid check digit.',
      });
    } else {
      data.gtin = identity.gtin;

      if (identity.batchNumber || identity.serialNumber) {
        issues.push({
          code: 'UNSUPPORTED_VALUE',
          severity: 'WARNING',
          field: 'gtin',
          message:
            'The supplied GS1 value contains batch or serial information. The product importer stores the canonical GTIN only; batch and serial data are not imported in this version.',
        });
      }
    }
  }

  /*
   * Barcode remains distinct from GTIN.
   * We deliberately do not interpret or manufacture a GTIN from it.
   */
  const barcode = textValue(raw.barcode);

  if (barcode) {
    data.barcode = barcode;
  }

  const retailerSku = textValue(raw.retailerSku);

  if (retailerSku) {
    data.retailerSku = retailerSku;
  }

  addOptionalText(data, 'brand', raw.brand);
  addOptionalText(data, 'description', raw.description);
  addOptionalText(data, 'subcategory', raw.subcategory);
  addOptionalText(data, 'department', raw.department);
  addOptionalText(data, 'imageUrl', raw.imageUrl);

  const promotionalPriceRaw = textValue(raw.promotionalPrice);

  if (promotionalPriceRaw) {
    const promotionalPrice = numericValue(raw.promotionalPrice);

    if (promotionalPrice === null) {
      issues.push({
        code: 'INVALID_PRICE',
        severity: 'ERROR',
        field: 'promotionalPrice',
        message:
          'Promotional price must be a valid numeric value such as 24.99. Do not include currency symbols.',
      });
    } else if (promotionalPrice < 0) {
      issues.push({
        code: 'INVALID_PRICE',
        severity: 'ERROR',
        field: 'promotionalPrice',
        message: 'Promotional price cannot be negative.',
      });
    } else {
      data.promotionalPrice = Number(promotionalPrice.toFixed(2));
    }
  }

  const hasErrors = issues.some((issue) => issue.severity === 'ERROR');
  const hasWarnings = issues.some(
    (issue) => issue.severity === 'WARNING'
  );

  if (hasErrors) {
    return {
      status: 'REJECTED',
      issues,
    };
  }

  return {
    status: hasWarnings ? 'WARNING' : 'VALID',
    data,
    issues,
  };
}
