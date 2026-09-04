/**
 * Bulk Product Import Domain Types
 *
 * Defines the contract for CSV/XLSX product imports.
 *
 * Important:
 * - Import processing must ultimately create CanonicalProduct records.
 * - Import data must never determine the canonical productId.
 * - GTIN is optional and must never be fabricated.
 * - Retailer-owned identifiers remain retailer-owned.
 */

export type ProductImportFileType = 'CSV' | 'XLSX';

export type ProductImportJobStatus =
  | 'PENDING'
  | 'VALIDATING'
  | 'READY'
  | 'IMPORTING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'FAILED';

export type ProductImportRowStatus =
  | 'PENDING'
  | 'VALID'
  | 'WARNING'
  | 'REJECTED'
  | 'IMPORTED'
  | 'DUPLICATE';

export type ProductImportDuplicateClassification =
  | 'NEW'
  | 'DUPLICATE'
  | 'UPDATE';

export type ProductImportIssueSeverity =
  | 'WARNING'
  | 'ERROR';

export type ProductImportIssueCode =
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_PRICE'
  | 'INVALID_CURRENCY'
  | 'INVALID_GTIN'
  | 'INVALID_BARCODE'
  | 'DUPLICATE_GTIN'
  | 'DUPLICATE_SKU'
  | 'DUPLICATE_BARCODE'
  | 'DUPLICATE_ROW'
  | 'UNSUPPORTED_VALUE'
  | 'INVALID_IMAGE_URL'
  | 'INVALID_ROW';

export type ProductImportIssue = {
  code: ProductImportIssueCode;
  severity: ProductImportIssueSeverity;
  field?: string;
  message: string;
};

export type ProductImportRow = {
  rowNumber: number;
  raw: Record<string, unknown>;
  mapped: Record<string, unknown>;
  status: ProductImportRowStatus;
  duplicateClassification?: ProductImportDuplicateClassification;
  issues: ProductImportIssue[];
};

export type ProductImportMapping = {
  sourceColumn: string;
  targetField: string;
};

export type ProductImportPreview = {
  columns: string[];
  rows: ProductImportRow[];
  totalRows: number;
  validRows: number;
  warningRows: number;
  rejectedRows: number;
};

export type ProductImportPreviewRow = {
  rowNumber: number;
  mapped: Record<string, unknown>;
  status: ProductImportRowStatus;
  duplicateClassification?: ProductImportDuplicateClassification;
  issues: ProductImportIssue[];
  validatedData?: Record<string, unknown>;
};

export type ProductImportPreviewResult = {
  rows: ProductImportPreviewRow[];
  totalRows: number;
  validRows: number;
  warningRows: number;
  rejectedRows: number;
  duplicateRows: number;
};

export type ProductImportJob = {
  importJobId: string;
  retailerId: string;
  filename: string;
  fileType: ProductImportFileType;
  source: 'BULK_IMPORT';
  status: ProductImportJobStatus;
  startedAt: unknown;
  completedAt?: unknown;
  totalRows: number;
  validRows: number;
  warningRows: number;
  rejectedRows: number;
  createdRows: number;
  duplicateRows: number;
  createdBy: string;
  mappings: ProductImportMapping[];
};

export type ProductImportResult = {
  importJobId: string;
  status: ProductImportJobStatus;
  totalRows: number;
  importedRows: number;
  warningRows: number;
  rejectedRows: number;
  duplicateRows: number;
  errors: ProductImportRow[];
};
