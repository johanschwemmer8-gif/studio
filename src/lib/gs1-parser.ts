/**
 * @fileOverview GS1-aligned parser for Digital Link and AIDC formats.
 * Normalizes global identifiers into a canonical structure for the iNteract Identity Layer.
 * VERSION: 1.1.0 (Checksum Verified)
 */

export type GS1Identity = {
  gtin: string;
  batchNumber?: string;
  serialNumber?: string;
  isDigitalLink: boolean;
};

/**
 * Validates a GS1 identifier (GTIN-8, 12, 13, 14) using the Modulo-10 algorithm.
 * Strictly enforces mathematical validity of the check digit.
 * 
 * Algorithm:
 * 1. Multiply digits by alternating weights (3, 1, 3, 1...) from right to left.
 * 2. Sum the results.
 * 3. The check digit is (10 - (sum % 10)) % 10.
 */
function validateGS1Checksum(input: string): boolean {
  if (!/^\d+$/.test(input) || ![8, 12, 13, 14].includes(input.length)) return false;
  
  const digits = input.split('').map(Number);
  const checkDigit = digits.pop()!;
  let sum = 0;
  
  // Weights: The first digit to the left of the check digit is always multiplied by 3.
  // The next is multiplied by 1, and so on.
  for (let i = 0; i < digits.length; i++) {
    const positionFromRight = digits.length - i; 
    const multiplier = (positionFromRight % 2 !== 0) ? 3 : 1;
    sum += digits[i] * multiplier;
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return checkDigit === calculatedCheckDigit;
}

/**
 * Parses raw GS1 strings into a normalized identity object.
 * Supports GS1 Digital Link URIs, AIDC encoded strings, and raw GTINs.
 * 
 * NOTE: This is a stateless identity resolution function.
 * Normalizes all GTIN formats (8, 12, 13, 14) to a 14-digit zero-padded string.
 * VERIFICATION: Strictly validates GS1 Modulo-10 checksums.
 */
export function parseGS1(input: string): GS1Identity | null {
  if (!input) return null;

  let gtin = '';
  let batchNumber = '';
  let serialNumber = '';
  let isDigitalLink = false;

  // 1. Extraction Phase
  // Handle URL / GS1 Digital Link compatible format
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
    const gtinMatch = input.match(/\(01\)(\d{8,14})/);
    gtin = gtinMatch ? gtinMatch[1] : '';

    const batchMatch = input.match(/\(10\)([A-Z0-9]+)/);
    batchNumber = batchMatch ? batchMatch[1] : '';

    const serialMatch = input.match(/\(21\)([A-Z0-9]+)/);
    serialNumber = serialMatch ? serialMatch[1] : '';
  }
  // Fallback to numeric-only GTIN formats
  else if (/^\d{8,14}$/.test(input)) {
    gtin = input;
  }

  // 2. Validation & Normalization Phase
  if (!gtin) return null;

  // PRE-NORMALIZATION CHECKSUM VALIDATION
  // Validates the mathematical integrity of the original identifier.
  if (!validateGS1Checksum(gtin)) {
    console.warn(`[GS1Parser] Checksum validation failed for identifier: ${gtin}`);
    return null;
  }

  // CANONICAL NORMALIZATION (Pad to GTIN-14)
  // Ensures consistent 14-digit representation for all downstream data operations.
  const canonicalGtin = gtin.padStart(14, '0');

  return {
    gtin: canonicalGtin,
    batchNumber: batchNumber || undefined,
    serialNumber: serialNumber || undefined,
    isDigitalLink,
  };
}
