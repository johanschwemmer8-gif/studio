
'use server';
/**
 * @fileOverview A Genkit flow to submit a bulk QR code generation request.
 *
 * - submitBulkQrRequest - A callable function to queue a new bulk QR code job.
 * - SubmitBulkQrRequestInput - The input type for the flow.
 * - SubmitBulkQrRequestOutput - The return type for the flow.
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
});

// Define the input schema for the callable function
const SubmitBulkQrRequestInputSchema = z.object({
  retailerId: z.string().describe('The ID of the retailer for this batch.'),
  campaignId: z.string().describe('The ID of the campaign for this batch.'),
  count: z.number().int().min(1).max(500, "Cannot request more than 500 codes at a time.").describe('The number of QR codes to generate (max 500).'),
  baseRedirect: z.string().url().refine(s => s.startsWith('https://'), "Base redirect URL must be HTTPS."),
  options: QrOptionsSchema.optional(),
  // createdBy would be derived from the auth context in a real scenario
});
export type SubmitBulkQrRequestInput = z.infer<typeof SubmitBulkQrRequestInputSchema>;

// Define the output schema
const SubmitBulkQrRequestOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.string(),
});
export type SubmitBulkQrRequestOutput = z.infer<typeof SubmitBulkQrRequestOutputSchema>;

// The main exported function that acts as our callable endpoint
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
    if (!db) {
        throw new Error('Firestore is not initialized. Check Firebase Admin SDK configuration.');
    }
    
    // In a real Firebase Callable Function, you'd get the auth context here.
    const createdBy = 'simulated-user@example.com'; 
    const callerRetailerId = data.retailerId; // Placeholder for custom claim verification
    
    // Enforce tenant matching
    if (callerRetailerId !== data.retailerId) {
      throw new Error('User is not authorized to create requests for this retailer.');
    }

    const { retailerId, campaignId, count, baseRedirect, options } = data;
    
    const requestRef = db.collection('bulkQrRequests').doc();
    
    const batch = db.batch();
    const requestData = {
        retailerId,
        campaignId,
        totalRequested: count,
        status: 'QUEUED',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: createdBy,
        options: options || {},
    };
    batch.set(requestRef, requestData);

    // Create N item stubs
    for (let i = 0; i < count; i++) {
      const qrCodeId = db.collection('qrcodes').doc().id; 
      const itemRef = requestRef.collection('items').doc(qrCodeId);
      
      const itemData = {
          index: i,
          qrCodeId: qrCodeId,
          retailerId: retailerId, // Crucial for scoped deletion and analytics
          redirectUrl: '', 
          signedUrl: '',
          storagePath: '',
          status: 'PENDING',
          error: '',
          checksum: '',
          params: {},
      };
      batch.set(itemRef, itemData);
    }

    await batch.commit();
    
    return { success: true, requestId: requestRef.id };
  }
);
