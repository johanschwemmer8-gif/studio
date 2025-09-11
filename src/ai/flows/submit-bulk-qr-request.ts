
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
    // App Check would also be enforced by the Firebase Functions runtime.
    //
    // Example:
    // if (context.app == undefined) {
    //   throw new functions.https.HttpsError(
    //     'failed-precondition',
    //     'The function must be called from an App Check verified app.'
    //   );
    // }
    // if (context.auth == undefined) { 
    //   throw new functions.https.HttpsError('unauthenticated', 'Authentication required.'); 
    // }
    // const { uid, token } = context.auth;
    // const callerRetailerId = token.retailerId; // From custom claims
    const createdBy = 'simulated-user@example.com'; // Placeholder for auth.token.email or auth.uid
    const callerRetailerId = 'simulated-retailer-id'; // Placeholder for custom claim
    
    // Authorization check: Enforce tenant matching.
    if (callerRetailerId !== data.retailerId) {
      throw new Error('User is not authorized to create requests for this retailer.');
    }

    const { retailerId, campaignId, count, baseRedirect, options } = data;
    
    const requestRef = db.collection('bulkQrRequests').doc();
    
    // === Conceptual Quota Check ===
    // In a real implementation, this would be a transaction.
    // const tenantRef = db.collection('tenants').doc(retailerId);
    // await db.runTransaction(async (transaction) => {
    //   const tenantDoc = await transaction.get(tenantRef);
    //   if (!tenantDoc.exists) {
    //     throw new Error('Tenant configuration not found.');
    //   }
    //   const tenantData = tenantDoc.data();
    //   const { dailyLimit, usedToday, resetAt } = tenantData;
    //
    //   // Check if reset is needed
    //   if (new Date() > resetAt.toDate()) {
    //      // reset usedToday and update resetAt, handle logic here
    //   }
    //
    //   if (usedToday + count > dailyLimit) {
    //     throw new Error('Daily quota exceeded.');
    //   }
    //
    //   transaction.update(tenantRef, { usedToday: admin.firestore.FieldValue.increment(count) });
    // });
    // === End Conceptual Quota Check ===


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
      const qrCodeId = db.collection('qrcodes').doc().id; // Pre-generate a unique ID
      const itemRef = requestRef.collection('items').doc(qrCodeId);
      
      const itemData = {
          index: i,
          qrCodeId: qrCodeId,
          redirectUrl: '', // To be filled by processor
          signedUrl: '',
          storagePath: '',
          status: 'PENDING',
          error: '',
          checksum: '',
          params: {},
          retryCount: 0, // Initialize retry count
      };
      batch.set(itemRef, itemData);
    }

    await batch.commit();
    
    return { success: true, requestId: requestRef.id };
  }
);
