
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

// Re-usable QR generation logic
const generateQrForItem = (item: any, requestData: any) => {
    const { qrCodeId } = item;
    const qrOptions = requestData.options || {};
    const qrColor = qrOptions.colorHex ? qrOptions.colorHex.replace('#', '') : '000000';
    const qrBgColor = qrOptions.bgColorHex ? qrOptions.bgColorHex.replace('#', '') : 'ffffff';
    const qrError = qrOptions.logoPath ? 'H' : (qrOptions.errorCorrection || 'M');

    // Use the already existing redirectUrl from the item
    const qrData = item.redirectUrl; 
    const encodedQrData = encodeURIComponent(qrData);

    let generatedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodedQrData}&color=${qrColor}&bgcolor=${qrBgColor}&ecc=${qrError}`;

    if (qrOptions.logoPath) {
        generatedQrUrl += `&logo=${encodeURIComponent(qrOptions.logoPath)}`;
    }
    
    const storagePath = `qr/${requestData.retailerId}/${requestData.campaignId}/${qrCodeId}.png`;

    return {
        status: 'DONE',
        storagePath: storagePath,
        signedUrl: generatedQrUrl,
        checksum: '', // Placeholder for a real checksum/hash
        error: admin.firestore.FieldValue.delete(),
        regeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        regenerationCount: admin.firestore.FieldValue.increment(1),
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
  regeneratedAt: z.string(),
});
export type RegenerateQrCodeOutput = z.infer<typeof RegenerateQrCodeOutputSchema>;


export async function regenerateQrCode(input: RegenerateQrCodeInput): Promise<RegenerateQrCodeOutput> {
  // In a real Firebase environment, you would check for App Check and Auth context here.
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
    
    // In a real Firebase Callable Function, you'd get the auth context here.
    // App Check would also be enforced by the Firebase Functions runtime.
    //
    // Example:
    // if (!context.app) {
    //   throw new functions.https.HttpsError('failed-precondition', 'The function must be called from an App Check verified app.');
    // }
    // if (!context.auth) { 
    //   throw new functions.https.HttpsError('unauthenticated', 'Authentication required.'); 
    // }
    // const { uid, token } = context.auth;
    // const callerRetailerId = token.retailerId; // From custom claims
    const callerRetailerId = 'simulated-retailer-id'; // Placeholder for custom claim
    const actor = 'simulated-user@example.com'; // Placeholder for auth context

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
      throw new Error('User is not authorized to regenerate codes for this request.');
    }

    const updateData = generateQrForItem(itemData, requestData);

    const auditLogRef = db.collection('auditLogs').doc();
    const batch = db.batch();

    // 1. Update the item document
    batch.update(itemRef, updateData);

    // 2. Log the audit event
    batch.set(auditLogRef, {
        type: 'REGENERATE',
        requestId,
        retailerId: requestData.retailerId,
        campaignId: requestData.campaignId,
        actor,
        ip: '127.0.0.1', // Placeholder from request context
        userAgent: 'Simulated User Agent', // Placeholder from request context
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
            qrCodeId: qrCodeId,
            previousStatus: itemData.status,
        }
    });

    await batch.commit();
    
    // We need to re-fetch the document to get the server-generated timestamp
    const updatedItemDoc = await itemRef.get();
    const updatedData = updatedItemDoc.data()!;

    return {
      success: true,
      signedUrl: updatedData.signedUrl,
      // Convert Firestore Timestamp to ISO string for serialization
      regeneratedAt: (updatedData.regeneratedAt as admin.firestore.Timestamp).toDate().toISOString(),
    };
  }
);
