
'use server';
/**
 * @fileOverview Retrieves recent scan events with optional filtering.
 *
 * - getScanEvents - Fetches a list of scan events.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { subHours, subDays } from 'date-fns';
import {
  GetScanEventsInputSchema,
  type GetScanEventsInput,
  GetScanEventsOutputSchema,
  type GetScanEventsOutput,
} from '@/lib/schemas/scan-events';

if (!admin.apps.length) {
  admin.initializeApp();
}

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
