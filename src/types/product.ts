/**
 * Canonical Product Schema v1
 *
 * Authoritative representation of a product within iNteract.
 *
 * Identity rules:
 * - productId is the iNteract canonical identity.
 * - retailerId identifies the owning retailer/tenant.
 * - GTIN is an optional GS1 identifier.
 * - retailerSku is a retailer-owned identifier.
 * - barcode is a physical product identifier.
 *
 * No external identifier determines the canonical productId.
 */

export type CanonicalProductSource =
  | 'MANUAL'
  | 'BULK_IMPORT'
  | 'API'
  | 'SYSTEM';

export type CanonicalProductStatus =
  | 'DRAFT'
  | 'READY'
  | 'ACTIVE'
  | 'ARCHIVED';

export type CanonicalProductValidationStatus =
  | 'PENDING'
  | 'VALID'
  | 'INVALID';

export type CanonicalProductEnrichmentStatus =
  | 'NOT_STARTED'
  | 'PROCESSING'
  | 'COMPLETE'
  | 'FAILED';

export type CanonicalProductValidation = {
  status: CanonicalProductValidationStatus;
  warnings: string[];
  validatedAt: unknown;
};

export type CanonicalProductGS1 = {
  originalFormat: string;
  checkDigitValid: boolean;
  validatedAt: unknown;
};

export type CanonicalProductEnrichment = {
  status: CanonicalProductEnrichmentStatus;
};

export type CanonicalProduct = {
  // iNteract identity
  productId: string;
  retailerId: string;

  // Retailer/product identifiers
  retailerSku?: string;
  barcode?: string;
  gtin?: string;

  // Core retailer-supplied product data
  name: string;
  category: string;
  price: number;
  currency: string;

  // Optional retailer-supplied product data
  brand?: string;
  description?: string;
  subcategory?: string;
  department?: string;
  promotionalPrice?: number;
  imageUrl?: string;

  // iNteract operational state
  status: CanonicalProductStatus;
  source: CanonicalProductSource;

  // Validation and enrichment
  validation: CanonicalProductValidation;
  gs1?: CanonicalProductGS1;
  enrichment: CanonicalProductEnrichment;

  // Audit
  createdAt: unknown;
  updatedAt: unknown;
  createdBy: string;
  updatedBy: string;
};
