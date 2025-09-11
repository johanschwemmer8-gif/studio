
'use server';
/**
 * @fileOverview Retrieves detailed information and scan history for a single QR code.
 *
 * - getQrCodeDetails - A callable function to fetch QR code details.
 * - GetQrCodeDetailsInput - The input type for the function.
 * - GetQrCodeDetailsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';

const GetQrCodeDetailsInputSchema = z.object({
  retailerId: z.string(),
  qrCodeId: z.string(),
});
export type GetQrCodeDetailsInput = z.infer<typeof GetQrCodeDetailsInputSchema>;

const QrCodeMetadataSchema = z.object({
    campaignId: z.string(),
    createdAt: z.string(),
    expiresAt: z.string().nullable(),
    originalTargetUrl: z.string().url(),
    scanCount: z.number(),
    signedUrl: z.string().url(),
});

const ScanEventSchema = z.object({
    id: z.string(),
    timestamp: z.string(),
    userAgent: z.string(),
    referrer: z.string(),
    ip: z.string(),
});

const GetQrCodeDetailsOutputSchema = z.object({
  metadata: QrCodeMetadataSchema,
  scanEvents: z.array(ScanEventSchema),
  scansByDay: z.array(z.object({ date: z.string(), count: z.number() })),
});
export type GetQrCodeDetailsOutput = z.infer<typeof GetQrCodeDetailsOutputSchema>;


export async function getQrCodeDetails(input: GetQrCodeDetailsInput): Promise<GetQrCodeDetailsOutput> {
  // In a real Firebase environment, you would check for App Check token and auth context here.
  return getQrCodeDetailsFlow(input);
}


const getQrCodeDetailsFlow = ai.defineFlow(
  {
    name: 'getQrCodeDetailsFlow',
    inputSchema: GetQrCodeDetailsInputSchema,
    outputSchema: GetQrCodeDetailsOutputSchema,
  },
  async ({ retailerId, qrCodeId }) => {
    if (!db) {
      throw new Error('Firestore is not initialized.');
    }
    
    // Authorization Check
    const callerRetailerId = 'simulated-retailer-id'; // placeholder
    if (retailerId !== callerRetailerId) {
        throw new Error('User is not authorized to view details for this QR code.');
    }
    
    const qrCodeRef = db.collection('qrcodes').doc(qrCodeId);
    const qrCodeDoc = await qrCodeRef.get();

    if (!qrCodeDoc.exists || qrCodeDoc.data()?.retailerId !== retailerId) {
        throw new Error(`QR code ${qrCodeId} not found for this retailer.`);
    }

    const qrData = qrCodeDoc.data()!;

    // In a real implementation, you would perform Firestore queries here.
    // This section is mocked for demonstration purposes.

    // 1. Get recent scan events
    const scanEvents = [
        { id: 'scan1', timestamp: new Date().toISOString(), userAgent: 'Chrome/Desktop', referrer: 'https://google.com', ip: '192.168.1.1' },
        { id: 'scan2', timestamp: new Date(Date.now() - 3600000).toISOString(), userAgent: 'Safari/Mobile', referrer: '', ip: '10.0.0.5' },
    ];
    
    // 2. Get scans by day for the chart
    const scansByDay = [
        { date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], count: 5 },
        { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], count: 12 },
        { date: new Date().toISOString().split('T')[0], count: 8 },
    ];
    
    return {
      metadata: {
        campaignId: qrData.campaignId,
        createdAt: qrData.createdAt.toDate().toISOString(),
        expiresAt: qrData.expiresAt ? qrData.expiresAt.toDate().toISOString() : null,
        originalTargetUrl: qrData.meta?.originalUrl || qrData.redirectUrl,
        scanCount: qrData.scanCount,
        signedUrl: qrData.signedUrl,
      },
      scanEvents,
      scansByDay,
    };
  }
);
