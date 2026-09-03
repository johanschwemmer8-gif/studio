/**
 * Bulk Product Import File Reader
 *
 * Reads CSV and XLSX files into a neutral tabular structure.
 *
 * Responsibilities:
 * - Detect supported file type.
 * - Parse CSV using PapaParse.
 * - Parse XLSX using SheetJS.
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
import * as XLSX from 'xlsx';

export type ProductImportFileType = 'CSV' | 'XLSX';

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
  if (extension === 'xlsx') return 'XLSX';

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

function readXlsx(
  buffer: ArrayBuffer,
  filename: string
): ProductImportReadResult {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: false,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('The Excel workbook does not contain a worksheet.');
  }

  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    throw new Error('The selected Excel worksheet could not be read.');
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: '',
    raw: true,
  });

  if (rawRows.length === 0) {
    return {
      fileType: 'XLSX',
      filename,
      columns: [],
      rows: [],
    };
  }

  const headerRow = rawRows[0] || [];

  const columns = headerRow.map(cleanColumnName);

  if (columns.every((column) => !column)) {
    throw new Error('The Excel worksheet does not contain a header row.');
  }

  const rows: ProductImportSourceRow[] = [];

  for (let index = 1; index < rawRows.length; index += 1) {
    const sourceRow = rawRows[index] || [];

    const values: Record<string, unknown> = {};

    columns.forEach((column, columnIndex) => {
      if (!column) return;
      values[column] = sourceRow[columnIndex] ?? '';
    });

    const hasValue = Object.values(values).some(
      (value) => String(value ?? '').trim() !== ''
    );

    if (hasValue) {
      rows.push({
        rowNumber: index + 1,
        values,
      });
    }
  }

  return {
    fileType: 'XLSX',
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
      'Unsupported file type. Please upload a CSV or XLSX file.'
    );
  }

  if (fileType === 'CSV') {
    const content = await file.text();

    return readCsv(content, file.name);
  }

  const buffer = await file.arrayBuffer();

  return readXlsx(buffer, file.name);
}
