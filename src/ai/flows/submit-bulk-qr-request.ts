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
  aiTone: z.string().optional().describe("e.g., Playful and exciting, Professional and informative"),
  aiGoal: z.string().optional().describe("e.g., Drive sales for the new shoe line"),
  aiPersona: z.string().optional().describe("e.g., Expert Denim Stylist, Friendly In-Store Helper"),
  aiGreeting: z.string().optional().describe("e.g., Hi there! Ready to discover your perfect fit?"),
  aiKeyPoints: z.string().optional().describe("e.g., - Made from 100% organic cotton\n- Water-saving dye process\n- 5-year durability guarantee"),
  aiOffer: z.string().optional().describe("e.g., 15% off today only, Free sample with purchase"),
  aiRecommendations: z.string().optional().describe("e.g., Recommend matching accessories, Suggest the premium version of this product"),
  expiresAt: z.string().datetime().optional(),
  redirectType: z.enum(['permanent', 'temporary']).default('temporary'),
  // New fields for media content
  mediaType: z.enum(['image', 'video']).optional(),
  mediaUrl: z.string().url("Must be a valid URL for the media.").optional().or(z.literal('')),
  headline: z.string().optional(),
  subhead: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().optional(),
  category: z.string().optional(),
});

// Define the input schema for the callable function
const SubmitBulkQrRequestInputSchema = z.object({
  retailerId: z.string().describe('The ID of the retailer for this batch.'),
  campaignId: z.string().describe('The ID of the campaign for this batch.'),
  count: z.number().int().min(1).max(10000, "Cannot request more than 10,000 codes at a time.").describe('The number of QR codes to generate (max 10000).'),
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
    
    // In a real Firebase Callable Function, you'd get auth context here.
    const createdBy = 'simulated-user@example.com';
    const callerRetailerId = 'simulated-retailer-id'; 
    
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

    const trackingUrlBase = 'https://interact-aoe.app/track/';

    // Create N item stubs
    for (let i = 0; i < count; i++) {
      const qrCodeId = db.collection('qrcodes').doc().id;
      const itemRef = requestRef.collection('items').doc(qrCodeId);
      
      const itemData = {
          index: i,
          qrCodeId: qrCodeId,
          trackingUrl: `${trackingUrlBase}${qrCodeId}`, // The URL the QR code will encode
          finalRedirectUrl: baseRedirect, // The URL the user goes to after the interaction
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
