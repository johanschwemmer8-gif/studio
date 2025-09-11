'use server';
/**
 * @fileOverview A Genkit flow for bulk-generating QR code documents in Firestore.
 *
 * - generateBulkQrCodes - A function to create a specified number of QR code documents.
 * - GenerateBulkQrCodesInput - The input type for the flow.
 * - GenerateBulkQrCodesOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';

const GenerateBulkQrCodesInputSchema = z.object({
  retailerId: z.string().describe('The ID of the retailer for this batch.'),
  campaignId: z.string().describe('The ID of the campaign for this batch.'),
  quantity: z.number().int().min(1).max(500).describe('The number of QR codes to generate (max 500).'),
  baseUrl: z.string().url().describe('The base URL for the target link.'),
  customParams: z.string().optional().describe('A string of custom URL parameters to append (e.g., "utm_source=instore&utm_medium=qr").'),
});
export type GenerateBulkQrCodesInput = z.infer<typeof GenerateBulkQrCodesInputSchema>;

const GenerateBulkQrCodesOutputSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  batchId: z.string(),
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
    const { retailerId, campaignId, quantity, baseUrl, customParams } = data;
    const batch = db.batch();
    const batchId = `batch-${Date.now()}`;

    for (let i = 0; i < quantity; i++) {
      const qrRef = db.collection('qrcodes').doc();
      
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
        targetUrl: targetUrl.toString(),
        status: 'active',
        createdAt: new Date(),
        batchId,
      };
      batch.set(qrRef, qrData);
    }

    await batch.commit();
    
    return { success: true, count: quantity, batchId };
  }
);
