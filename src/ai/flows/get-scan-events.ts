'use server';
/**
 * @fileOverview Retrieves recent scan events with optional filtering.
 * Anchors all events to a sessionId to satisfy the Intelligence Layer requirements.
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
  return getScanEventsFlow(input);
}

const getScanEventsFlow = ai.defineFlow(
  {
    name: 'getScanEventsFlow',
    inputSchema: GetScanEventsInputSchema,
    outputSchema: GetScanEventsOutputSchema,
  },
  async (filters) => {
    // Infrastructure Simulation: Returning session-anchored events.
    // Note: Multiple events may share the same sessionId (e.g., refresh or double-scan).
    const mockEvents: GetScanEventsOutput = [
        {
            eventId: 'ev_1',
            sessionId: 'sess_alpha',
            gtin: '06001234567891',
            retailerId: 'simulated-retailer-id',
            campaignId: 'summer-sale-2024',
            timestamp: new Date().toISOString(),
            userAgent: 'iPhone/Safari',
            referrer: 'https://google.com',
        },
        {
            eventId: 'ev_2',
            sessionId: 'sess_alpha', // Same session as ev_1 (Intelligence Layer should deduplicate)
            gtin: '06001234567891',
            retailerId: 'simulated-retailer-id',
            campaignId: 'summer-sale-2024',
            timestamp: subHours(new Date(), 1).toISOString(),
            userAgent: 'iPhone/Safari',
            referrer: 'https://google.com',
        },
        {
            eventId: 'ev_3',
            sessionId: 'sess_beta',
            gtin: '06001234567891',
            retailerId: 'simulated-retailer-id',
            campaignId: 'summer-sale-2024',
            timestamp: subHours(new Date(), 2).toISOString(),
            userAgent: 'Android/Chrome',
            referrer: '',
        },
        {
            eventId: 'ev_4',
            sessionId: 'sess_gamma',
            gtin: '06009876543210',
            retailerId: 'simulated-retailer-id',
            campaignId: 'winter-clearance',
            timestamp: subDays(new Date(), 1).toISOString(),
            userAgent: 'iPhone/Safari',
            referrer: 'https://instagram.com',
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
