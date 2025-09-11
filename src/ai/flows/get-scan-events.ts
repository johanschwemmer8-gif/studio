
'use server';
/**
 * @fileOverview Retrieves recent scan events with optional filtering.
 *
 * - getScanEvents - Fetches a list of scan events.
 * - GetScanEventsInput - The input type for the function.
 * - GetScanEventsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const GetScanEventsInputSchema = z.object({
  retailerId: z.string().optional(),
  campaignId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});
export type GetScanEventsInput = z.infer<typeof GetScanEventsInputSchema>;

const ScanEventSchema = z.object({
    eventId: z.string(),
    qrCodeId: z.string(),
    retailerId: z.string(),
    campaignId: z.string(),
    timestamp: z.string(),
    userAgent: z.string(),
    referrer: z.string(),
});

const GetScanEventsOutputSchema = z.array(ScanEventSchema);
export type GetScanEventsOutput = z.infer<typeof GetScanEventsOutputSchema>;

export async function getScanEvents(input: GetScanEventsInput): Promise<GetScanEventsOutput> {
  // In a real environment, add auth/permission checks.
  return getScanEventsFlow(input);
}

const getScanEventsFlow = ai.defineFlow(
  {
    name: 'getScanEventsFlow',
    inputSchema: GetScanEventsInputSchema,
    outputSchema: GetScanEventsOutputSchema,
  },
  async (filters) => {
    // This flow would query Firestore. For this prototype, we return mock data
    // consistent with the filters to demonstrate functionality.

    const mockEvents: GetScanEventsOutput = [
        {
            eventId: 'scan_1',
            qrCodeId: 'qr_abc123',
            retailerId: 'simulated-retailer-id',
            campaignId: 'summer-sale-2023',
            timestamp: new Date().toISOString(),
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
            referrer: 'https://www.google.com/',
        },
        {
            eventId: 'scan_2',
            qrCodeId: 'qr_def456',
            retailerId: 'simulated-retailer-id',
            campaignId: 'summer-sale-2023',
            timestamp: subHours(new Date(), 2).toISOString(),
            userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
            referrer: '',
        },
        {
            eventId: 'scan_3',
            qrCodeId: 'qr_ghi789',
            retailerId: 'other-retailer',
            campaignId: 'winter-clearance',
            timestamp: subHours(new Date(), 5).toISOString(),
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
            referrer: 'https://www.facebook.com/',
        },
         {
            eventId: 'scan_4',
            qrCodeId: 'qr_jkl012',
            retailerId: 'simulated-retailer-id',
            campaignId: 'daily-deals',
            timestamp: subDays(new Date(), 3).toISOString(),
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
            referrer: '',
        }
    ];
    
    return mockEvents.filter(event => {
        const eventDate = new Date(event.timestamp);
        const isRetailerMatch = !filters.retailerId || event.retailerId === filters.retailerId;
        const isCampaignMatch = !filters.campaignId || event.campaignId === filters.campaignId;
        const isStartDateMatch = !filters.startDate || eventDate >= new Date(filters.startDate);
        const isEndDateMatch = !filters.endDate || eventDate <= new Date(filters.endDate);
        return isRetailerMatch && isCampaignMatch && isStartDateMatch && isEndDateMatch;
    }).slice(0, filters.limit);
  }
);


// Helper functions for mock data generation
function subHours(date: Date, hours: number): Date {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() - hours);
    return newDate;
}

function subDays(date: Date, days: number): Date {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - days);
    return newDate;
}
