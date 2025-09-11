
'use server';
/**
 * @fileOverview A Genkit flow for importing external QR codes from a CSV file.
 *
 * - importExternalQrCodes - Imports a batch of external QR codes into Firestore.
 * - ImportExternalQrCodesInput - The input type for the flow.
 * - ImportExternalQrCodesOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import Papa from 'papaparse';

if (!admin.apps.length) {
  admin.initializeApp();
}

const QrCodeRecordSchema = z.object({
  id: z.string(),
  url: z.string().url(),
});

const ImportExternalQrCodesInputSchema = z.object({
  retailerId: z.string().describe('The ID of the retailer for this batch.'),
  campaignId: z.string().describe('The ID of the campaign for this batch.'),
  csvData: z.string().describe('The CSV content as a string. Must contain "id" and "url" headers.'),
});
export type ImportExternalQrCodesInput = z.infer<typeof ImportExternalQrCodesInputSchema>;

const ImportExternalQrCodesOutputSchema = z.object({
  success: z.boolean(),
  importedCount: z.number(),
  errorCount: z.number(),
  batchId: z.string(),
});
export type ImportExternalQrCodesOutput = z.infer<typeof ImportExternalQrCodesOutputSchema>;

export async function importExternalQrCodes(input: ImportExternalQrCodesInput): Promise<ImportExternalQrCodesOutput> {
  // In a real Firebase environment, you would check for App Check token here.
  // Example for a callable function:
  // if (context.app == undefined) {
  //   throw new functions.https.HttpsError(
  //     'failed-precondition',
  //     'The function must be called from an App Check verified app.'
  //   );
  // }
  return importExternalQrCodesFlow(input);
}

const importExternalQrCodesFlow = ai.defineFlow(
  {
    name: 'importExternalQrCodesFlow',
    inputSchema: ImportExternalQrCodesInputSchema,
    outputSchema: ImportExternalQrCodesOutputSchema,
  },
  async (data) => {
    const db = admin.firestore();
    const { retailerId, campaignId, csvData } = data;
    const batch = db.batch();
    const batchId = `ext-batch-${Date.now()}`;
    let importedCount = 0;
    let errorCount = 0;

    const parseResult = Papa.parse(csvData, { header: true, skipEmptyLines: true });

    if (parseResult.errors.length > 0) {
        console.error('CSV Parsing errors:', parseResult.errors);
        // Potentially throw an error or handle it gracefully
    }
    
    for (const row of parseResult.data) {
        const validation = QrCodeRecordSchema.safeParse(row);
        if (validation.success) {
            const { id, url } = validation.data;
            const qrRef = db.collection('externalQRCodes').doc(id);

            const qrData = {
                retailerId,
                campaignId,
                originalUrl: url,
                interactUrl: `/track/${id}`, // This is the wrapped URL
                scanCount: 0,
                status: 'active',
                createdAt: new Date(),
                batchId,
            };
            batch.set(qrRef, qrData);
            importedCount++;
        } else {
            console.warn('Skipping invalid row:', row, validation.error.flatten());
            errorCount++;
        }
    }

    await batch.commit();
    
    return { success: true, importedCount, errorCount, batchId };
  }
);
