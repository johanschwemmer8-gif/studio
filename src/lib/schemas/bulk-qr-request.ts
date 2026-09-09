import { z } from 'genkit';

/**
 * @fileOverview iNteract AOE — QR Activation Data Contract (Gate 2 Hardened)
 * 
 * CORE ARCHITECTURAL SPINE:
 * Campaign → Activation → QR Identity → Shopper Experience
 * 
 * INVARIANTS:
 * 1. ONE ACTIVATION = ONE QR: Every document in bulkQrRequests represents exactly one Point-of-Decision.
 * 2. ACTIVATION-FIRST: The QR is the identity of the Activation, NOT the product.
 * 3. TARGET vs CONTEXT: Target defines the promotional intent. Context provides supporting data.
 * 4. AUTHORITATIVE ID: requestId and qrCodeId are immutable anchors for the shopper journey.
 */

export const QrActivationTargetSchema = z.object({
  /**
   * RETAILER INTENT / TARGET
   * Defines the promotional objective.
   */
  department: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  productType: z.string().optional(),
  brandId: z.string().optional(),
  brandName: z.string().optional(),
  targetProductName: z.string().optional(),
  targetProductGtin: z.string().optional(),
}).describe('The intended promotional objective for this Point-of-Decision.');

export const QRProductContextSchema = z.object({
  /**
   * PRODUCT CONTEXT
   * Authoritative products available in this decision context.
   * Rule: productGtins[] provides context without multiplying QR identities.
   */
  productGtins: z.array(z.string()).default([]),
}).describe('Contextual product data for the shopper environment.');

export const QrOptionsSchema = z.object({
  colorHex: z.string().optional(),
  bgColorHex: z.string().optional(),
  logoPath: z.string().url().optional(),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  
  batchNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  isGs1DigitalLink: z.boolean().default(true),

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

  isBulk: z.boolean().optional(),
});

export const SubmitBulkQrRequestInputSchema = z.object({
  idToken: z.string().describe('Authoritative identity token.'),
  retailerId: z.string().describe('Validated tenant ID.'),
  brandId: z.string().describe('Brand association.'),
  campaignId: z.string().min(1, 'Campaign association is required.'),

  /**
   * RETAILER INTENT (TARGET)
   */
  target: QrActivationTargetSchema,

  /**
   * PRODUCT CONTEXT
   */
  productGtins: z.array(z.string()).default([]),

  /**
   * PHYSICAL POINT-OF-DECISION (POD)
   */
  storeId: z.string().optional(),
  storeName: z.string().min(1, 'Store name is required for activation.'),
  location: z.string().min(1, 'Physical location is required for activation.'),

  shopperObjective: z.string().optional(),

  /**
   * CARDINALITY ENFORCEMENT: 1 Activation = 1 QR.
   */
  count: z.number().int().min(1).max(1).default(1),

  /**
   * SYSTEM INVARIANTS: IDEMPOTENCY
   * Prevents duplicate activation creation during retry cycles.
   */
  idempotencyKey: z.string().optional().describe('Unique client-generated key for duplicate prevention.'),

  options: QrOptionsSchema.optional(),
  productName: z.string().optional(),
});

export type SubmitBulkQrRequestInput = z.infer<typeof SubmitBulkQrRequestInputSchema>;
export type QrActivationTarget = z.infer<typeof QrActivationTargetSchema>;
