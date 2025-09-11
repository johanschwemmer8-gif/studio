
'use server';
/**
 * @fileOverview A Genkit flow for bulk-generating QR code documents in Firestore.
 *
 * - generateBulkQrCodes - A function to create a specified number of QR code documents based on the new schema.
 * - GenerateBulkQrCodesInput - The input type for the flow.
 * - GenerateBulkQrCodesOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';

const QrOptionsSchema = z.object({
  colorHex: z.string().optional(),
  bgColorHex: z.string().optional(),
  logoPath: z.string().optional(),
  moduleShape: z.string().optional(),
  eyeStyle: z.string().optional(),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  aiTone: z.string().optional(),
  aiGoal: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  redirectType: z.enum(['permanent', 'temporary']).default('temporary'),
});

const GenerateBulkQrCodesInputSchema = z.object({
  retailerId: z.string().describe('The ID of the retailer for this batch.'),
  campaignId: z.string().describe('The ID of the campaign for this batch.'),
  quantity: z.number().int().min(1).max(500).describe('The number of QR codes to generate (max 500).'),
  baseUrl: z.string().url().describe('The base URL for the target link.'),
  customParams: z.string().optional().describe('A string of custom URL parameters to append (e.g., "utm_source=instore&utm_medium=qr").'),
  options: QrOptionsSchema.optional(),
  createdBy: z.string().describe('The UID or email of the user creating the request.'),
});
export type GenerateBulkQrCodesInput = z.infer<typeof GenerateBulkQrCodesInputSchema>;

const GenerateBulkQrCodesOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.string(),
  count: z.number(),
});
export type GenerateBulkQrCodesOutput = z.infer<typeof GenerateBulkQrCodesOutputSchema>;

export async function generateBulkQrCodes(input: GenerateBulkQrCodesInput): Promise<GenerateBulkQrCodesOutput> {
  return generateBulkQrCodesFlow(input);
}

const generateBulkQrCodesFlow = ai.defineFlow(
  {
    name: 'generateBulkQrCodesFlow',
    inputSchema: GenerateBulkQrCodesInputSchema,
    outputSchema: GenerateBulkQrCodesOutputSchema,
  },
  async (data) => {
    if (!db) {
        throw new Error('Firestore is not initialized. Check Firebase Admin SDK configuration.');
    }
    const { retailerId, campaignId, quantity, baseUrl, customParams, options, createdBy } = data;
    
    const requestRef = db.collection('bulkQrRequests').doc();
    const batch = db.batch();

    const requestData = {
        retailerId,
        campaignId,
        totalRequested: quantity,
        status: 'QUEUED',
        createdAt: new Date(),
        createdBy,
        options: options || {},
    };
    batch.set(requestRef, requestData);

    for (let i = 0; i < quantity; i++) {
      const qrRef = db.collection('qrcodes').doc();
      const itemRef = requestRef.collection('items').doc(qrRef.id);
      
      const targetUrl = new URL(baseUrl);
      targetUrl.searchParams.append('id', qrRef.id);
      if (customParams) {
          const params = new URLSearchParams(customParams);
          params.forEach((value, key) => {
              targetUrl.searchParams.append(key, value);
          });
      }

      const qrData = {
        retailerId,
        campaignId,
        qrCodeId: qrRef.id,
        requestId: requestRef.id,
        redirectUrl: targetUrl.toString(),
        storagePath: '',
        signedUrl: '',
        scanCount: 0,
        createdAt: new Date(),
        expiresAt: options?.expiresAt ? new Date(options.expiresAt) : null,
        meta: {},
      };
      batch.set(qrRef, qrData);

      const itemData = {
          index: i,
          qrCodeId: qrRef.id,
          redirectUrl: targetUrl.toString(),
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
    
    // In a real scenario, you might update the status to COMPLETED
    // after a separate processing step. For this simulation, we'll
    // just update it here after the batch write.
    await requestRef.update({ status: 'COMPLETED' });
    
    return { success: true, requestId: requestRef.id, count: quantity };
  }
);
