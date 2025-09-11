
'use server';
/**
 * @fileOverview A Genkit flow to generate a ZIP archive of QR codes for a given request.
 *
 * - generateZipForRequest - A callable function to create and return a ZIP file.
 * - GenerateZipForRequestInput - The input type for the flow.
 * - GenerateZipForRequestOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import JSZip from 'jszip';
import fetch from 'node-fetch';

if (!admin.apps.length) {
  admin.initializeApp();
}

const GenerateZipForRequestInputSchema = z.object({
  requestId: z.string().describe('The ID of the bulk QR request.'),
});
export type GenerateZipForRequestInput = z.infer<typeof GenerateZipForRequestInputSchema>;

const GenerateZipForRequestOutputSchema = z.object({
  success: z.boolean(),
  zipDataUri: z.string().optional().describe('A base64 encoded data URI for the generated ZIP file.'),
  message: z.string(),
});
export type GenerateZipForRequestOutput = z.infer<typeof GenerateZipForRequestOutputSchema>;


export async function generateZipForRequest(input: GenerateZipForRequestInput): Promise<GenerateZipForRequestOutput> {
  // In a real Firebase environment, you would check for App Check token here.
  // Example for an HTTPS function:
  // if (req.header('X-Firebase-AppCheck') === undefined) {
  //   res.status(403).send('Unauthorized');
  //   return;
  // }
  return generateZipForRequestFlow(input);
}


const generateZipForRequestFlow = ai.defineFlow(
  {
    name: 'generateZipForRequestFlow',
    inputSchema: GenerateZipForRequestInputSchema,
    outputSchema: GenerateZipForRequestOutputSchema,
  },
  async ({ requestId }) => {
    const db = admin.firestore();

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

    const requestRef = db.collection('bulkQrRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return { success: false, message: `Request with ID ${requestId} not found.` };
    }

    const requestData = requestDoc.data();
    
    // Authorization check: Ensure the caller's retailerId matches the request's retailerId.
    if (requestData?.retailerId !== callerRetailerId) {
        return { success: false, message: `User is not authorized to access this request.` };
    }

    if (!requestData || requestData.status !== 'COMPLETED') {
        return { success: false, message: `Request ${requestId} is not completed.` };
    }

    const itemsSnapshot = await requestRef.collection('items').where('status', '==', 'DONE').get();
    
    if (itemsSnapshot.empty) {
      return { success: false, message: 'No completed QR codes found to zip.' };
    }

    const zip = new JSZip();
    const manifestRows = [['qrCodeId', 'redirectUrl', 'storagePath', 'createdAt', 'checksum']];


    for (const itemDoc of itemsSnapshot.docs) {
      const item = itemDoc.data();
      
      // Add row to manifest
      manifestRows.push([
          item.qrCodeId,
          item.redirectUrl,
          item.storagePath,
          requestData.createdAt.toDate().toISOString(), // Using request's creation time for all items
          item.checksum || '',
      ]);

      if (item.signedUrl) {
        try {
          const response = await fetch(item.signedUrl);
          if (!response.ok) {
            console.warn(`Failed to fetch image for ${item.qrCodeId}: ${response.statusText}`);
            continue; // Skip this file
          }
          const imageBuffer = await response.arrayBuffer();
          zip.file(`${item.qrCodeId}.png`, imageBuffer);
        } catch (error: any) {
          console.error(`Error fetching or adding file for ${item.qrCodeId}:`, error.message);
        }
      }
    }
    
    // Add the manifest.csv to the zip
    const csvContent = manifestRows.map(row => row.join(',')).join('\n');
    zip.file('manifest.csv', csvContent);


    const zipContent = await zip.generateAsync({ type: 'base64' });
    const zipDataUri = `data:application/zip;base64,${zipContent}`;

    // === Log the download event to the audit trail ===
    const auditLogRef = db.collection('auditLogs').doc();
    // In a real function, these would come from the request context.
    const actor = 'simulated-user@example.com'; // Placeholder from auth context (e.g., context.auth.token.email)
    const ip = '127.0.0.1'; // Placeholder from request headers (e.g., req.ip)
    const userAgent = 'Simulated User Agent'; // Placeholder from request headers (e.g., req.get('User-Agent'))

    await auditLogRef.set({
        type: 'ZIP_DOWNLOAD',
        requestId,
        retailerId: requestData.retailerId,
        campaignId: requestData.campaignId,
        actor,
        ip,
        userAgent,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
            itemCount: itemsSnapshot.size
        }
    });
    // === End logging ===

    return {
      success: true,
      message: `Successfully generated ZIP file for request ${requestId}.`,
      zipDataUri,
    };
  }
);
