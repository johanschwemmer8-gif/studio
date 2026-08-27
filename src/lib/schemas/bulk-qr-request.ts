import { z } from 'genkit';

/**
 * @fileOverview GS1-compliant QR Request Schemas.
 * Moved from server-flow modules to resolve 'use server' non-function export errors.
 */

export const QrOptionsSchema = z.object({
  colorHex: z.string().optional(),
  bgColorHex: z.string().optional(),
  logoPath: z.string().url().optional(),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  
  // GS1 Compliance Fields
  gtin: z.string().length(14, "GTIN must be 14 digits.").optional(),
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
});

export const SubmitBulkQrRequestInputSchema = z.object({
  idToken: z.string().describe("Firebase ID token for authoritative identity resolution."),
  retailerId: z.string().describe('The intended ID of the retailer.'),
  brandId: z.string().describe('The brand ID.'),
  campaignId: z.string().min(1, "Campaign name is required").describe('The campaign ID.'),
  productName: z.string().optional().describe("Friendly name of the product for the manifest."),
  count: z.number().int().min(1).max(10000),
  options: QrOptionsSchema.optional(),
});

export type SubmitBulkQrRequestInput = z.infer<typeof SubmitBulkQrRequestInputSchema>;
