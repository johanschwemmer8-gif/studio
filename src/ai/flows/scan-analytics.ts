
'use server';
/**
 * @fileOverview Aggregates and analyzes scan event data.
 *
 * - getScanAnalytics - Fetches and processes scan analytics.
 * - ScanAnalyticsInput - The input type for the function.
 * - ScanAnalyticsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { getScanEvents } from './get-scan-events';
import { GetScanEventsInputSchema } from '@/lib/schemas/scan-events';

if (!admin.apps.length) {
  admin.initializeApp();
}

const ScanAnalyticsInputSchema = GetScanEventsInputSchema.extend({
    // Future: add fields like `groupBy` (e.g., 'day', 'campaign', 'retailer')
});
export type ScanAnalyticsInput = z.infer<typeof ScanAnalyticsInputSchema>;

const TopScannedQrSchema = z.object({
    qrCodeId: z.string(),
    scanCount: z.number(),
    campaignId: z.string(),
});

const ScanAnalyticsOutputSchema = z.object({
    totalScans: z.number(),
    uniqueScans: z.number(),
    scansByDay: z.record(z.number()),
    topScannedCodes: z.array(TopScannedQrSchema),
});
export type ScanAnalyticsOutput = z.infer<typeof ScanAnalyticsOutputSchema>;


export async function getScanAnalytics(input: ScanAnalyticsInput): Promise<ScanAnalyticsOutput> {
  // In a real environment, add auth/permission checks.
  return getScanAnalyticsFlow(input);
}


const getScanAnalyticsFlow = ai.defineFlow(
  {
    name: 'getScanAnalyticsFlow',
    inputSchema: ScanAnalyticsInputSchema,
    outputSchema: ScanAnalyticsOutputSchema,
  },
  async (filters) => {
    const scanEvents = await getScanEvents(filters);

    const uniqueScans = new Set(scanEvents.map(e => e.qrCodeId)).size;
    
    const scansByDay: Record<string, number> = {};
    scanEvents.forEach(event => {
        const day = new Date(event.timestamp).toISOString().split('T')[0];
        scansByDay[day] = (scansByDay[day] || 0) + 1;
    });

    const scansByCode: Record<string, { count: number, campaignId: string }> = {};
    scanEvents.forEach(event => {
        if (!scansByCode[event.qrCodeId]) {
            scansByCode[event.qrCodeId] = { count: 0, campaignId: event.campaignId };
        }
        scansByCode[event.qrCodeId].count++;
    });
    
    const topScannedCodes = Object.entries(scansByCode)
        .map(([qrCodeId, data]) => ({ qrCodeId, scanCount: data.count, campaignId: data.campaignId }))
        .sort((a, b) => b.scanCount - a.scanCount)
        .slice(0, 10);

    return {
      totalScans: scanEvents.length,
      uniqueScans,
      scansByDay,
      topScannedCodes,
    };
  }
);
