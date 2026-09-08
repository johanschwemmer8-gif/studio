import { z } from 'genkit';

/**
 * @fileOverview QR Activation request schemas.
 *
 * ARCHITECTURE:
 * - One retailer-defined activation represents one Point-of-Decision objective.
 * - The QR is the digital identity of that activation.
 * - The QR is NOT the product identity.
 * - GTIN remains the authoritative product identifier.
 * - Target and Product Context are deliberately separate concepts.
 *
 * TARGET
 *   category
 *   subCategory
 *   productType
 *   brand
 *   specific product
 *   GTIN
 *
 * PRODUCT CONTEXT
 *   productGtins[]
 *
 * NOTE:
 * Legacy fields are retained temporarily for compatibility with the existing
 * draft/QR-generation consumers. They should be migrated deliberately rather
 * than removed in one uncontrolled change.
 */

export const QrActivationTargetSchema = z.object({
  /**
   * Retailer-defined promotion/decision hierarchy.
   * Not every level is mandatory.
   */
  category: z.string().optional(),
  subCategory: z.string().optional(),
  productType: z.string().optional(),

  /**
   * Brand is first-class data.
   * Do not rely on parsing/inferencing brand from productName.
   */
  brandId: z.string().optional(),
  brandName: z.string().optional(),

  /**
   * The product the retailer wants to promote.
   * GTIN must ultimately come from the retailer product catalogue.
   */
  targetProductName: z.string().optional(),
  targetProductGtin: z.string().optional(),
});

export const QrOptionsSchema = z.object({
  colorHex: z.string().optional(),
  bgColorHex: z.string().optional(),
  logoPath: z.string().url().optional(),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'),

  // ---------------------------------------------------------------------------
  // LEGACY GS1 / PRODUCT COMPATIBILITY
  // ---------------------------------------------------------------------------
  // Retained temporarily because existing UI and supporting flows still read
  // options.gtin. New activation logic must use target.targetProductGtin.
  gtin: z.string().length(14, 'GTIN must be 14 digits.').optional(),

  batchNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  isGs1DigitalLink: z.boolean().default(true),

  // AI / shopper experience configuration
  aiTone: z.string().optional(),
  aiGoal: z.string().optional(),
  aiPersona: z.string().optional(),
  aiGreeting: z.string().optional(),

  expiresAt: z.string().datetime().optional(),

  mediaType: z.enum(['image', 'video']).optional(),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  headline: z.string().optional(),
  subhead: z.string().optional(),

  scanDestination: z.enum(['url', 'ai']).default('ai'),
  landingPageUrl: z.string().url().optional().or(z.literal('')),
  
  /**
   * Metadata flag to identify activations created via the bulk generator.
   */
  isBulk: z.boolean().optional(),
});

export const SubmitBulkQrRequestInputSchema = z.object({
  /**
   * Firebase ID token used for authoritative identity resolution.
   */
  idToken: z
    .string()
    .describe('Firebase ID token for authoritative identity resolution.'),

  /**
   * Intended retailer tenant.
   * The server must verify this against the authenticated identity.
   */
  retailerId: z
    .string()
    .describe('The intended ID of the retailer.'),

  /**
   * Campaign/brand relationship.
   *
   * These remain part of the current request model because the existing
   * application already uses campaignId and brandId.
   */
  brandId: z
    .string()
    .describe('The brand ID associated with the activation.'),

  campaignId: z
    .string()
    .min(1, 'Campaign name is required')
    .describe('The campaign ID associated with the activation.'),

  /**
   * NEW ACTIVATION TARGET
   *
   * This is intentionally optional at the shared-schema level during the
   * migration because save-qr-campaign-draft.ts currently consumes this schema.
   *
   * submit-bulk-qr-request.ts will enforce that a valid target exists before
   * creating a production activation.
   */
  target: QrActivationTargetSchema.optional(),

  /**
   * Products available in the shopper decision/comparison context.
   *
   * These are catalogue GTINs, not additional QR identities.
   */
  productGtins: z
    .array(z.string())
    .default([]),

  /**
   * Physical Point-of-Decision context.
   *
   * `location` deliberately remains generic. It may represent an aisle,
   * end-cap, entrance display, promotional stand, checkout display, etc.
   *
   * This is NOT a shelf-management or planogram model.
   */
  storeId: z.string().optional(),
  storeName: z.string().optional(),
  location: z.string().optional(),

  /**
   * Shopper objective for this activation.
   */
  shopperObjective: z.string().optional(),

  /**
   * ENFORCED 1:1 CARDINALITY
   *
   * One activation = One QR identity.
   *
   * While count remains for pipeline compatibility, the submission flow
   * now enforces that one activation request creates exactly one identity.
   */
  count: z
    .number()
    .int()
    .min(1)
    .max(1)
    .default(1),

  /**
   * QR appearance and shopper-experience configuration.
   */
  options: QrOptionsSchema.optional(),

  /**
   * Legacy friendly product name used by existing manifests/dashboard code.
   * New activation records should derive the target product name from
   * target.targetProductName.
   */
  productName: z
    .string()
    .optional()
    .describe('Legacy friendly product name for compatibility.'),
});

export type SubmitBulkQrRequestInput = z.infer<
  typeof SubmitBulkQrRequestInputSchema
>;

export type QrActivationTarget = z.infer<
  typeof QrActivationTargetSchema
>;
