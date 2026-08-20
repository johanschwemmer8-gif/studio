'use server';
/**
 * @fileOverview A Genkit flow to regenerate a single QR code within a bulk request.
 * Hardened with server-side authorization and tenant isolation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';

if (!admin.apps.length) {
  admin.initializeApp();
}

const generateQrForItem = (item: any, requestData: any) => {
    const { qrCodeId } = item;
    const qrOptions = requestData.options || {};
    const qrColor = qrOptions.colorHex ? qrOptions.colorHex.replace('#', '') : '000000';
    const qrBgColor = qrOptions.bgColorHex ? qrOptions.bgColorHex.replace('#', '') : 'ffffff';
    const qrError = qrOptions.logoPath ? 'H' : (qrOptions.errorCorrection || 'M');

    const qrData = item.trackingUrl || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/resolve/${qrCodeId}`; 
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
        checksum: '', 
        error: admin.firestore.FieldValue.delete(),
        regeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        regenerationCount: admin.firestore.FieldValue.increment(1),
    };
};

const RegenerateQrCodeInputSchema = z.object({
  requestId: z.string(),
  qrCodeId: z.string(),
  idToken: z.string().describe("Firebase ID token for authorization."),
  retailerId: z.string().describe("The retailer ID for tenant verification."),
});
export type RegenerateQrCodeInput = z.infer<typeof RegenerateQrCodeInputSchema>;

const RegenerateQrCodeOutputSchema = z.object({
  success: z.boolean(),
  signedUrl: z.string(),
  regeneratedAt: z.string(),
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
  async ({ requestId, qrCodeId, idToken, retailerId }) => {
    // 1. Authorize & Resolve Authoritative Identity
    const authorizedRetailerId = await getAuthorizedRetailerId(idToken, retailerId);
    const actor = await verifyAuth(idToken);
    
    const db = admin.firestore();
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

    // 2. Security Check: Enforce tenant isolation
    if (requestData.retailerId !== authorizedRetailerId) {
      throw new Error('Access Denied: You are not authorized to regenerate codes for this tenant.');
    }

    const updateData = generateQrForItem(itemData, requestData);

    const auditLogRef = db.collection('auditLogs').doc();
    const batch = db.batch();

    batch.update(itemRef, updateData);

    batch.set(auditLogRef, {
        type: 'REGENERATE',
        requestId,
        retailerId: authorizedRetailerId,
        campaignId: requestData.campaignId,
        actorUid: actor.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
            qrCodeId: qrCodeId,
            previousStatus: itemData.status,
        }
    });

    await batch.commit();
    
    const updatedItemDoc = await itemRef.get();
    const updatedData = updatedItemDoc.data()!;

    return {
      success: true,
      signedUrl: updatedData.signedUrl,
      regeneratedAt: (updatedData.regeneratedAt as admin.firestore.Timestamp).toDate().toISOString(),
    };
  }
);
