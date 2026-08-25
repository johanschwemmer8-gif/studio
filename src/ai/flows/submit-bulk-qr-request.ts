'use server';
/**
 * @fileOverview A GS1-compliant Genkit flow to submit a bulk QR code generation request.
 * Supports GS1 Digital Link standards including GTIN, Batch, and Serial Number.
 * HARDENED: Now enforces trusted tenant identity via Firebase custom claims.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

// Define the schema for GS1 Digital Link options
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

// Explicitly export input schema for use in other draft-related flows
export const SubmitBulkQrRequestInputSchema = z.object({
  idToken: z.string().describe("Firebase ID token for authoritative identity resolution."),
  retailerId: z.string().describe('The intended ID of the retailer.'),
  brandId: z.string().describe('The brand ID.'),
  campaignId: z.string().describe('The campaign ID.'),
  productName: z.string().optional().describe("Friendly name of the product for the manifest."),
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
    // AUTHORIZATION GATE
    const authorizedRetailerId = await getAuthorizedRetailerId(data.idToken, data.retailerId);
    
    if (!db) {
        throw new Error('Infrastructure Layer Unavailable.');
    }

    const requestRef = db.collection('bulkQrRequests').doc();
    
    try {
        await requestRef.set({
            retailerId: authorizedRetailerId,
            brandId: data.brandId,
            campaignId: data.campaignId,
            productName: data.productName || 'Unnamed Product',
            totalRequested: data.count,
            status: 'DRAFT', // Set to DRAFT to allow UI-driven processing/chunking
            createdAt: new Date(),
            updatedAt: new Date(),
            options: data.options || {},
            itemsDone: 0,
            isGs1Compliant: true,
            dataStatus: 'VERIFIED'
        });

        console.log(`[QR Management] Verified Draft Created: ${requestRef.id} for Tenant ${authorizedRetailerId}`);
        
        return { 
            success: true, 
            requestId: requestRef.id 
        };

    } catch (error: any) {
        console.error(`[QR Management] Persistence Failure:`, error.message);
        throw new Error("Failed to queue batch generation.");
    }
  }
);
