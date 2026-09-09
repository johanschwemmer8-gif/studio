import { z } from 'genkit';

export const QrOptionsSchema = z.object({
  colorHex: z.string().optional(),
  bgColorHex: z.string().optional(),
  logoPath: z.string().url().optional(),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  aiTone: z.string().optional(),
  aiGoal: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  redirectType: z.enum(['permanent', 'temporary']).default('temporary'),
  gtin: z.string().optional(),
});

export const SubmitBulkQrRequestInputSchema = z.object({
  idToken: z.string().optional(),
  retailerId: z.string().describe('The ID of the retailer for this activation.'),
  campaignId: z.string().describe('The ID of the campaign for this activation.'),
  count: z.number().int().min(1).default(1).describe('Number of QR codes to generate.'),
  baseRedirect: z.string().url().optional().describe("Base redirect URL."),
  options: QrOptionsSchema.optional(),
  target: z.any().optional(),
  productGtins: z.array(z.string()).optional(),
  storeId: z.string().optional(),
  storeName: z.string().optional(),
  location: z.string().optional(),
  productName: z.string().optional(),
});

export type SubmitBulkQrRequestInput = z.infer<typeof SubmitBulkQrRequestInputSchema>;
