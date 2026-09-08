'use server';
/**
 * @fileOverview Legacy/Compatibility QR generation flow.
 * 
 * NOTE: This flow is being superseded by submit-bulk-qr-request.ts
 * which follows the 1:1 Activation:QR identity model more strictly.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';

// Define the schema for the options map
const QrOptionsSchema = z.object({
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

// Define the input schema for the callable function
const LegacySubmitBulkQrRequestInputSchema = z.object({
  retailerId: z.string().describe('The ID of the retailer for this activation.'),
  campaignId: z.string().describe('The ID of the campaign for this activation.'),
  count: z.number().int().min(1).max(1).default(1).describe('Must be 1 per activation.'),
  baseRedirect: z.string().url().optional().describe("Base redirect URL."),
  options: QrOptionsSchema.optional(),
  target: z.any().optional(),
  productGtins: z.array(z.string()).optional(),
  storeId: z.string().optional(),
  storeName: z.string().optional(),
  location: z.string().optional(),
});
export type SubmitBulkQrRequestInput = z.infer<typeof LegacySubmitBulkQrRequestInputSchema>;

// Define the output schema
const SubmitBulkQrRequestOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.string(),
});
export type SubmitBulkQrRequestOutput = z.infer<typeof SubmitBulkQrRequestOutputSchema>;

// The main exported function that acts as our callable endpoint
export async function submitBulkQrRequest(input: SubmitBulkQrRequestInput): Promise<SubmitBulkQrRequestOutput> {
  return legacySubmitBulkQrRequestFlow(input);
}

const legacySubmitBulkQrRequestFlow = ai.defineFlow(
  {
    name: 'legacySubmitBulkQrRequestFlow', // Renamed to avoid collision with submitBulkQrRequestFlow
    inputSchema: LegacySubmitBulkQrRequestInputSchema,
    outputSchema: SubmitBulkQrRequestOutputSchema,
  },
  async (data) => {
    if (!db) {
        throw new Error('Firestore is not initialized. Check Firebase Admin SDK configuration.');
    }
    
    // In a real environment, auth context would be verified here.
    const createdBy = 'simulated-user@example.com'; 
    const retailerId = data.retailerId;

    const { campaignId, options } = data;
    
    const requestRef = db.collection('bulkQrRequests').doc();
    const batch = db.batch();

    const requestData = {
        retailerId,
        campaignId,
        totalRequested: 1, // Enforced 1:1
        status: 'QUEUED',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: createdBy,
        options: options || {},
        target: data.target || null,
        productGtins: data.productGtins || [],
        storeId: data.storeId || null,
        storeName: data.storeName || null,
        location: data.location || null,
    };
    batch.set(requestRef, requestData);

    // Create exactly one identity stub
    const itemRef = requestRef.collection('items').doc();
    const qrCodeId = itemRef.id;

    const itemData = {
        index: 0,
        qrCodeId: qrCodeId,
        retailerId: retailerId,
        status: 'PENDING',
        error: '',
        targetProductGtin: options?.gtin || null,
        productGtins: data.productGtins || [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    batch.set(itemRef, itemData);

    await batch.commit();
    
    return { success: true, requestId: requestRef.id };
  }
);
