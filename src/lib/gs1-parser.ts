/**
 * @fileOverview GS1 Digital Link and AI Parser.
 * Normalizes various GS1 formats into a structured identity object.
 */

export type GS1Identity = {
  gtin: string;
  batchNumber?: string;
  serialNumber?: string;
  isDigitalLink: boolean;
};

/**
 * Parses a raw GS1 string or URL into a structured identity.
 * Supports:
 * - GS1 Digital Link: https://domain.com/01/12345678901234/10/ABC/21/XYZ
 * - AIDC Encoded: (01)12345678901234(10)ABC(21)XYZ
 * - Pure GTIN: 01=12345678901234
 */
export function parseGS1(input: string): GS1Identity | null {
  if (!input) return null;

  let gtin = '';
  let batchNumber = '';
  let serialNumber = '';
  let isDigitalLink = false;

  // Handle URL / Digital Link format
  if (input.includes('/01/')) {
    isDigitalLink = true;
    const parts = input.split('/');
    const gtinIndex = parts.indexOf('01') + 1;
    gtin = parts[gtinIndex] || '';

    const batchIndex = parts.indexOf('10');
    if (batchIndex !== -1) batchNumber = parts[batchIndex + 1];

    const serialIndex = parts.indexOf('21');
    if (serialIndex !== -1) serialNumber = parts[serialIndex + 1];
  } 
  // Handle AIDC (01)... format
  else if (input.startsWith('(01)') || input.includes('(01)')) {
    const gtinMatch = input.match(/\(01\)(\d{14})/);
    gtin = gtinMatch ? gtinMatch[1] : '';

    const batchMatch = input.match(/\(10\)([A-Z0-9]+)/);
    batchNumber = batchMatch ? batchMatch[1] : '';

    const serialMatch = input.match(/\(21\)([A-Z0-9]+)/);
    serialNumber = serialMatch ? serialMatch[1] : '';
  }
  // Handle Pure GTIN assignment
  else if (input.includes('01=')) {
    gtin = input.split('01=')[1]?.substring(0, 14);
  }
  // Fallback to raw numeric check
  else if (/^\d{13,14}$/.test(input)) {
    gtin = input.padStart(14, '0');
  }

  if (!gtin || gtin.length < 13) return null;

  return {
    gtin: gtin.padStart(14, '0'),
    batchNumber: batchNumber || undefined,
    serialNumber: serialNumber || undefined,
    isDigitalLink,
  };
}
