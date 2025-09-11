
'use server';
/**
 * @fileOverview A Genkit flow to regenerate a single QR code within a bulk request.
 *
 * - regenerateQrCode - A callable function to regenerate a specific QR code.
 * - RegenerateQrCodeInput - The input type for the flow.
 * - RegenerateQrCodeOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// Re-usable QR generation logic from process-bulk-qr-queue
const generateQrForItem = (item: any, requestData: any) => {
    const { qrCodeId } = item;
    const qrOptions = requestData.options || {};
    const qrColor = qrOptions.colorHex ? qrOptions.colorHex.replace('#', '') : '000000';
    const qrBgColor = qrOptions.bgColorHex ? qrOptions.bgColorHex.replace('#', '') : 'ffffff';
    const qrError = qrOptions.logoPath ? 'H' : (qrOptions.errorCorrection || 'M');

    const qrData = `${requestData.baseRedirect}?qr=${qrCodeId}`;
    const encodedQrData = encodeURIComponent(qrData);

    let generatedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodedQrData}&color=${qrColor}&bgcolor=${qrBgColor}&ecc=${qrError}`;

    if (qrOptions.logoPath) {
        generatedQrUrl += `&logo=${encodeURIComponent(qrOptions.logoPath)}`;
    }
    
    const storagePath = `qr/${requestData.retailerId}/${requestData.campaignId}/${qrCodeId}.png`;

    return {
        status: 'DONE',
        redirectUrl: qrData,
        storagePath: storagePath,
        signedUrl: generatedQrUrl,
        checksum: '', // Placeholder
        error: admin.firestore.FieldValue.delete(), // Clear previous error
        lastRegeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
};


const RegenerateQrCodeInputSchema = z.object({
  requestId: z.string(),
  qrCodeId: z.string(),
});
export type RegenerateQrCodeInput = z.infer<typeof RegenerateQrCodeInputSchema>;

const RegenerateQrCodeOutputSchema = z.object({
  success: z.boolean(),
  signedUrl: z.string(),
  lastRegeneratedAt: z.string(),
});
export type RegenerateQrCodeOutput = z.infer<typeof RegenerateQrCodeOutputSchema>;


export async function regenerateQrCode(input: RegenerateQrCodeInput): Promise<RegenerateQrCodeOutput> {
  return regenerateQrCodeFlow(input);
}


const regenerateQrCodeFlow = ai.defineFlow(
  {
    name: 'regenerateQrCodeFlow',
    inputSchema: RegenerateQrCodeInputSchema,
    outputSchema: RegenerateQrCodeOutputSchema,
  },
  async ({ requestId, qrCodeId }) => {
    if (!db) {
      throw new Error('Firestore is not initialized.');
    }
    
    // Simulate auth check
    const callerRetailerId = 'simulated-retailer-id';

    const requestRef = db.collection('bulkQrRequests').doc(requestId);
    const itemRef = requestRef.collection('items').doc(qrCodeId);

    const [requestDoc, itemDoc] = await Promise.all([requestRef.get(), itemRef.get()]);

    if (!requestDoc.exists) {
      throw new Error(`Request with ID ${requestId} not found.`);
    }
    if (!itemDoc.exists) {
      throw new Error(`QR code with ID ${qrCodeId} not found in request.`);
    }

    const requestData = requestDoc.data()!;
    const itemData = itemDoc.data()!;

    // Authorization check
    if (requestData.retailerId !== callerRetailerId) {
      throw new Error('User is not authorized to access this request.');
    }

    const updateData = generateQrForItem(itemData, requestData);

    await itemRef.update(updateData);
    
    // We need to re-fetch the document to get the server-generated timestamp
    const updatedItemDoc = await itemRef.get();
    const updatedData = updatedItemDoc.data()!;

    return {
      success: true,
      signedUrl: updatedData.signedUrl,
      // Convert Firestore Timestamp to ISO string for serialization
      lastRegeneratedAt: (updatedData.lastRegeneratedAt as admin.firestore.Timestamp).toDate().toISOString(),
    };
  }
);
