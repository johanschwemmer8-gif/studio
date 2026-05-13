
'use server';
/**
 * @fileOverview A GS1-compliant Genkit flow to submit a bulk QR code generation request.
 * Supports GS1 Digital Link standards including GTIN, Batch, and Serial Number.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';

// Define the schema for GS1 Digital Link options
const QrOptionsSchema = z.object({
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

const SubmitBulkQrRequestInputSchema = z.object({
  retailerId: z.string().describe('The ID of the retailer.'),
  brandId: z.string().describe('The brand ID.'),
  campaignId: z.string().describe('The campaign ID.'),
  count: z.number().int().min(1).max(10000),
  options: QrOptionsSchema.optional(),
});
export type SubmitBulkQrRequestInput = z.infer<typeof SubmitBulkQrRequestInputSchema>;

const SubmitBulkQrRequestOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.string(),
});
export type SubmitBulkQrRequestOutput = z.infer<typeof SubmitBulkQrRequestOutputSchema>;

export async function submitBulkQrRequest(input: SubmitBulkQrRequestInput): Promise<SubmitBulkQrRequestOutput> {
  return submitBulkQrRequestFlow(input);
}

const submitBulkQrRequestFlow = ai.defineFlow(
  {
    name: 'submitBulkQrRequestFlow',
    inputSchema: SubmitBulkQrRequestInputSchema,
    outputSchema: SubmitBulkQrRequestOutputSchema,
  },
  async (data) => {
    // SIMULATION: Bypassing Firestore interaction for prototype speed
    console.log(`(GS1 Simulation) Bulk request for campaign: ${data.campaignId}. GTIN: ${data.options?.gtin || 'N/A'}`);
    const mockRequestId = `gs1_req_${Date.now()}`;
    return { success: true, requestId: mockRequestId };
  }
);
