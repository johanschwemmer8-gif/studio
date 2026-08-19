
'use server';
/**
 * @fileOverview Intelligence Layer Aggregator.
 * Enforces session-first logic: All GTIN analytics must be derived from session context.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { getScanEvents } from './get-scan-events';
import { GetScanEventsInputSchema } from '@/lib/schemas/scan-events';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

if (!admin.apps.length) {
  admin.initializeApp();
}

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
    // AUTHORIZATION GATE
    const authorizedRetailerId = await getAuthorizedRetailerId(filters.idToken, filters.retailerId || 'simulated-retailer-id');
    
    // Explicitly scope filters to authorized tenant
    const securedFilters = { ...filters, retailerId: authorizedRetailerId };
    
    const events = await getScanEvents(securedFilters);

    // 1. Calculate True Reach (Unique Sessions)
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
    
    // 2. Aggregate by Day using unique sessions as unit
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

    // 3. Aggregate GTIN Popularity (Unique Sessions per GTIN)
    // Rule Enforcement: GTIN is a dimension of the session, not a direct primary key.
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
      uniqueSessions,
      engagementByDay,
      topEngagedProducts,
    };
  }
);
