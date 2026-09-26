import { z } from "zod";

/**
 * Canonical Ari Product Evidence contract.
 *
 * PURPOSE
 * -------
 * Product identity and product knowledge are separate concerns.
 *
 * Identity is anchored by authoritative iNteract product / GTIN /
 * Activation context.
 *
 * Product knowledge may be assembled from multiple eligible evidence
 * sources. No individual source is required for Ari to remain operational.
 *
 * This schema is shared infrastructure for:
 * - Compare Options
 * - Guided Suitability
 * - Explore Product
 * - future Ari product-intelligence capabilities
 *
 * IMPORTANT
 * ---------
 * Evidence acquisition does not belong to presentation templates.
 * Templates consume normalized evidence only.
 */

export const ProductEvidenceSourceTypeSchema = z.enum([
  "INTERACT_PRODUCT_CATALOG",
  "RETAILER_ECOMMERCE",
  "RETAILER_PIM",
  "RETAILER_API",
  "RETAILER_WEBSITE",
  "MANUFACTURER",
  "BRAND",
  "MANUFACTURER_DOCUMENTATION",
  "PUBLIC_PRODUCT_DATA",
  "PUBLIC_WEB",
  "SHOPPER_PROVIDED",
]);

export type ProductEvidenceSourceType = z.infer<
  typeof ProductEvidenceSourceTypeSchema
>;

export const ProductEvidenceVerificationStateSchema = z.enum([
  "VERIFIED",
  "SUPPORTED",
  "UNVERIFIED",
  "CONFLICTED",
]);

export type ProductEvidenceVerificationState = z.infer<
  typeof ProductEvidenceVerificationStateSchema
>;

export const ProductEvidenceSourceSchema = z.object({
  sourceType: ProductEvidenceSourceTypeSchema,
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().optional(),

  /**
   * ISO-8601 retrieval timestamp.
   * Evidence freshness must never be silently discarded.
   */
  retrievedAt: z.string().datetime(),

  /**
   * True only when the evidence source was matched to the authoritative
   * product identity with sufficient confidence for use.
   */
  identityMatched: z.boolean(),
});

export type ProductEvidenceSource = z.infer<
  typeof ProductEvidenceSourceSchema
>;

export const ProductEvidenceFactSchema = z.object({
  /**
   * Stable semantic key, for example:
   * "brand", "weight", "voltage", "ingredients", "price".
   */
  key: z.string().min(1),

  /**
   * Shopper-facing label.
   */
  label: z.string().min(1),

  /**
   * Normalized display value supported by evidence.
   * Ari must never manufacture this value.
   */
  value: z.string().min(1),

  /**
   * Optional unit retained separately where the source provides one.
   */
  unit: z.string().min(1).optional(),

  source: ProductEvidenceSourceSchema,

  verificationState: ProductEvidenceVerificationStateSchema,

  /**
   * True where another eligible source supplies materially conflicting
   * evidence for the same semantic fact.
   */
  hasConflict: z.boolean().default(false),
});

export type ProductEvidenceFact = z.infer<
  typeof ProductEvidenceFactSchema
>;

export const ProductEvidenceIdentitySchema = z.object({
  gtin: z.string().min(1),
  productId: z.string().min(1).optional(),
  productName: z.string().min(1).optional(),
  brandName: z.string().min(1).optional(),
});

export type ProductEvidenceIdentity = z.infer<
  typeof ProductEvidenceIdentitySchema
>;

export const ProductEvidencePackageSchema = z.object({
  /**
   * Authoritative identity anchor. Research may enrich knowledge but may
   * never silently replace this identity.
   */
  identity: ProductEvidenceIdentitySchema,

  facts: z.array(ProductEvidenceFactSchema),

  /**
   * Records whether evidence was sufficient for the requested operation.
   * Insufficient evidence does not mean Ari has failed.
   */
  evidenceState: z.enum([
    "SUFFICIENT",
    "LIMITED",
    "INSUFFICIENT",
  ]),

  /**
   * Human-readable evidence limitations that Ari may communicate without
   * inventing missing facts.
   */
  limitations: z.array(z.string().min(1)).default([]),
});

export type ProductEvidencePackage = z.infer<
  typeof ProductEvidencePackageSchema
>;

/**
 * Canonical evidence pair consumed by Compare Options.
 *
 * Comparison logic must compare only facts supported by these packages.
 */
export const ProductComparisonEvidenceSchema = z.object({
  productA: ProductEvidencePackageSchema,
  productB: ProductEvidencePackageSchema,
});

export type ProductComparisonEvidence = z.infer<
  typeof ProductComparisonEvidenceSchema
>;
