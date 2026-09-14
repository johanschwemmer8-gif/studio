/**
 * Bulk Product Import File Reader
 *
 * Reads CSV product import files into a neutral tabular structure.
 *
 * Responsibilities:
 * - Detect supported file type.
 * - Parse CSV using PapaParse.
 * - Preserve source column names.
 * - Preserve spreadsheet row numbers.
 *
 * This layer does NOT:
 * - validate product fields;
 * - detect duplicates;
 * - create product IDs;
 * - write to Firestore;
 * - create canonical products.
 */

import Papa from 'papaparse';

export type ProductImportFileType = 'CSV';

export type ProductImportSourceRow = {
  rowNumber: number;
  values: Record<string, unknown>;
};

export type ProductImportReadResult = {
  fileType: ProductImportFileType;
  filename: string;
  columns: string[];
  rows: ProductImportSourceRow[];
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function getFileType(filename: string): ProductImportFileType | null {
  const extension = filename.toLowerCase().split('.').pop();

  if (extension === 'csv') return 'CSV';

  return null;
}

function cleanColumnName(value: unknown): string {
  return String(value ?? '').trim();
}

function readCsv(
  content: string,
  filename: string
): ProductImportReadResult {
  const parsed = Papa.parse<Record<string, unknown>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => cleanColumnName(header),
  });

  const columns = parsed.meta.fields || [];

  const rows: ProductImportSourceRow[] = parsed.data.map(
    (values, index) => ({
      rowNumber: index + 2,
      values,
    })
  );

  return {
    fileType: 'CSV',
    filename,
    columns,
    rows,
  };
}

export async function readProductImportFile(
  file: File
): Promise<ProductImportReadResult> {
  if (!file) {
    throw new Error('No import file was supplied.');
  }

  if (!file.name) {
    throw new Error('The import file must have a filename.');
  }

  if (file.size === 0) {
    throw new Error('The import file is empty.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      'The import file is too large. The maximum supported file size is 10 MB.'
    );
  }

  const fileType = getFileType(file.name);

  if (!fileType) {
    throw new Error(
      'Unsupported file type. Please upload a CSV file.'
    );
  }

  const content = await file.text();

  return readCsv(content, file.name);
}
