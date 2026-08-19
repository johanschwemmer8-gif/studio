
/**
 * @fileOverview GS1-aligned parser for Digital Link and AIDC formats.
 * Normalizes global identifiers into a canonical structure for the iNteract Identity Layer.
 */

export type GS1Identity = {
  gtin: string;
  batchNumber?: string;
  serialNumber?: string;
  isDigitalLink: boolean;
};

/**
 * Parses raw GS1 strings into a normalized identity object.
 * Supports GS1 Digital Link URIs, AIDC encoded strings, and raw GTINs.
 * 
 * NOTE: This is a stateless identity resolution function.
 * Normalizes all GTIN formats (8, 12, 13, 14) to a 14-digit zero-padded string.
 */
export function parseGS1(input: string): GS1Identity | null {
  if (!input) return null;

  let gtin = '';
  let batchNumber = '';
  let serialNumber = '';
  let isDigitalLink = false;

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

  if (!gtin || gtin.length < 8) return null;

  return {
    gtin: gtin.padStart(14, '0'),
    batchNumber: batchNumber || undefined,
    serialNumber: serialNumber || undefined,
    isDigitalLink,
  };
}
