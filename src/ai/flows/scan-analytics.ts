'use server';
/**
 * @fileOverview Live Intelligence Layer Aggregator.
 * AUDIT VERSION: 2.0.0 (Grounded in real Firestore events)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getScanEvents } from './get-scan-events';
import { GetScanEventsInputSchema } from '@/lib/schemas/scan-events';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

const ScanAnalyticsInputSchema = GetScanEventsInputSchema.extend({});
export type ScanAnalyticsInput = z.infer<typeof ScanAnalyticsInputSchema>;

const TopProductEngagementSchema = z.object({
    gtin: z.string(),
    uniqueSessions: z.number().describe('Number of unique sessions that interacted with this GTIN.'),
    campaignId: z.string(),
});

const ScanAnalyticsOutputSchema = z.object({
    totalRawEvents: z.number().describe('Total raw log entries.'),
    uniqueSessions: z.number().describe('Total unique customer sessions (True Reach).'),
    engagementByDay: z.record(z.number()),
    topEngagedProducts: z.array(TopProductEngagementSchema),
});
export type ScanAnalyticsOutput = z.infer<typeof ScanAnalyticsOutputSchema>;

export async function getScanAnalytics(input: ScanAnalyticsInput): Promise<ScanAnalyticsOutput> {
  return getScanAnalyticsFlow(input);
}

const getScanAnalyticsFlow = ai.defineFlow(
  {
    name: 'getScanAnalyticsFlow',
    inputSchema: ScanAnalyticsInputSchema,
    outputSchema: ScanAnalyticsOutputSchema,
  },
  async (filters) => {
    // 1. Authorize & Fetch Real Events
    const events = await getScanEvents(filters);

    if (events.length === 0) {
        return {
            totalRawEvents: 0,
            uniqueSessions: 0,
            engagementByDay: {},
            topEngagedProducts: [],
        };
    }

    // 2. Calculate True Reach (Unique Sessions)
    const sessionIds = new Set(events.map(e => e.sessionId));
    const uniqueSessionsCount = sessionIds.size;
    
    // 3. Aggregate by Day using unique sessions as unit
    const sessionsByDay: Record<string, Set<string>> = {};
    events.forEach(event => {
        const day = new Date(event.timestamp).toISOString().split('T')[0];
        if (!sessionsByDay[day]) sessionsByDay[day] = new Set();
        sessionsByDay[day].add(event.sessionId);
    });
    
    const engagementByDay: Record<string, number> = {};
    Object.keys(sessionsByDay).forEach(day => {
        engagementByDay[day] = sessionsByDay[day].size;
    });

    // 4. Aggregate GTIN Popularity (Unique Sessions per GTIN)
    const sessionsByGtin: Record<string, { sessions: Set<string>, campaignId: string }> = {};
    events.forEach(event => {
        if (!sessionsByGtin[event.gtin]) {
            sessionsByGtin[event.gtin] = { sessions: new Set(), campaignId: event.campaignId };
        }
        sessionsByGtin[event.gtin].sessions.add(event.sessionId);
    });
    
    const topEngagedProducts = Object.entries(sessionsByGtin)
        .map(([gtin, data]) => ({ 
            gtin, 
            uniqueSessions: data.sessions.size, 
            campaignId: data.campaignId 
        }))
        .sort((a, b) => b.uniqueSessions - a.uniqueSessions)
        .slice(0, 10);

    return {
      totalRawEvents: events.length,
      uniqueSessions: uniqueSessionsCount,
      engagementByDay,
      topEngagedProducts,
    };
  }
);
