

'use server';
/**
 * @fileOverview Batch CSV Importer for external QR identifiers.
 * Implements chunked processing for high-volume imports.
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
    const batchId = `ext-batch-${Date.now()}`;
    const BATCH_SIZE = 500;
    let importedCount = 0;
    let errorCount = 0;

    const parseResult = Papa.parse(csvData, { header: true, skipEmptyLines: true });

    if (parseResult.errors.length > 0) {
        console.error('CSV Parsing errors:', parseResult.errors);
    }
    
    const validRows = parseResult.data.filter(row => {
        const v = QrCodeRecordSchema.safeParse(row);
        if (!v.success) errorCount++;
        return v.success;
    });

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        const chunk = validRows.slice(i, i + BATCH_SIZE);
        const batch = db.batch();
        
        chunk.forEach((row: any) => {
            const { id, url } = QrCodeRecordSchema.parse(row);
            const qrRef = db.collection('externalQRCodes').doc(id);
            batch.set(qrRef, {
                retailerId,
                campaignId,
                originalUrl: url,
                interactUrl: `/track/${id}`,
                scanCount: 0,
                status: 'active',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                batchId,
            });
            importedCount++;
        });

        await batch.commit();
    }
    
    return { success: true, importedCount, errorCount, batchId };
  }
);
