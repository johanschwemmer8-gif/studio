'use server';
/**
 * @fileOverview A Genkit flow to generate a ZIP archive of QR codes for a given request.
 * Normalizes manifest for human-friendly store deployment.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import JSZip from 'jszip';
import fetch from 'node-fetch';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

if (!admin.apps.length) {
  admin.initializeApp();
}

const GenerateZipForRequestInputSchema = z.object({
  requestId: z.string().describe('The ID of the bulk QR request.'),
  idToken: z.string().optional().describe("User's ID token for authorization."),
});
export type GenerateZipForRequestInput = z.infer<typeof GenerateZipForRequestInputSchema>;

const GenerateZipForRequestOutputSchema = z.object({
  success: z.boolean(),
  zipDataUri: z.string().optional().describe('A base64 encoded data URI for the generated ZIP file.'),
  message: z.string(),
});
export type GenerateZipForRequestOutput = z.infer<typeof GenerateZipForRequestOutputSchema>;

export async function generateZipForRequest(input: GenerateZipForRequestInput): Promise<GenerateZipForRequestOutput> {
  return generateZipForRequestFlow(input);
}

const generateZipForRequestFlow = ai.defineFlow(
  {
    name: 'generateZipForRequestFlow',
    inputSchema: GenerateZipForRequestInputSchema,
    outputSchema: GenerateZipForRequestOutputSchema,
  },
  async ({ requestId, idToken }) => {
    const db = admin.firestore();
    const requestRef = db.collection('bulkQrRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return { success: false, message: `Request with ID ${requestId} not found.` };
    }

    const requestData = requestDoc.data()!;
    
    // AUTHORIZATION GATE
    await getAuthorizedRetailerId(idToken, requestData.retailerId);

    if (requestData.status !== 'COMPLETED') {
        return { success: false, message: `Request ${requestId} is not completed.` };
    }

    const itemsSnapshot = await requestRef.collection('items').where('status', '==', 'DONE').get();
    
    if (itemsSnapshot.empty) {
      return { success: false, message: 'No completed QR codes found to zip.' };
    }

    const zip = new JSZip();
    
    // Outcome-Oriented Manifest for Store Managers
    const manifestRows = [['Product Name', 'Barcode (GTIN)', 'Sticker Filename', 'Digital Link (Scan URL)', 'Generated Date']];
    const productName = requestData.productName || 'Unassigned Product';
    const barcode = requestData.options?.gtin || 'Unknown';

    for (const itemDoc of itemsSnapshot.docs) {
      const item = itemDoc.data();
      const fileName = `${item.qrCodeId}.png`;
      
      manifestRows.push([
          productName,
          barcode,
          fileName,
          item.trackingUrl || `[ID: ${item.qrCodeId}]`,
          requestData.createdAt.toDate().toLocaleDateString(),
      ]);

      if (item.signedUrl) {
        try {
          const response = await fetch(item.signedUrl);
          if (response.ok) {
            const imageBuffer = await response.arrayBuffer();
            zip.file(fileName, imageBuffer);
          }
        } catch (error: any) {
          console.error(`Zip fetch failure for ${item.qrCodeId}:`, error.message);
        }
      }
    }
    
    // Add Store-Manager friendly manifest
    const csvContent = manifestRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    zip.file('deployment_manifest.csv', csvContent);

    const zipContent = await zip.generateAsync({ type: 'base64' });
    const zipDataUri = `data:application/zip;base64,${zipContent}`;

    // Audit Log
    await db.collection('auditLogs').add({
        type: 'ZIP_DOWNLOAD',
        requestId,
        retailerId: requestData.retailerId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: { itemCount: itemsSnapshot.size }
    });

    return {
      success: true,
      message: `Successfully generated package for ${productName}.`,
      zipDataUri,
    };
  }
);
