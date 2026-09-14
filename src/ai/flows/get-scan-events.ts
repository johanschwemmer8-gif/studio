'use server';
/**
 * @fileOverview Retrieves real scan and interaction events from Firestore.
 * Enforces strict tenant isolation via trusted authentication context.
 * AUDIT VERSION: 2.0.0 (Live Data Enabled)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDb, admin } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';
import {
  GetScanEventsInputSchema,
  type GetScanEventsInput,
  GetScanEventsOutputSchema,
  type GetScanEventsOutput,
} from '@/lib/schemas/scan-events';

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
    const db = getDb();
    if (!db) {
        throw new Error("Infrastructure Layer Unavailable.");
    }

    // 1. Resolve Authoritative Retailer Identity
    const authorizedRetailerId = await getAuthorizedRetailerId(filters.idToken, filters.retailerId || '');

    // 2. Build Factual Query
    let query = db.collection('events')
        .where('retailerId', '==', authorizedRetailerId);

    if (filters.campaignId) {
        query = query.where('campaignId', '==', filters.campaignId);
    }

    if (filters.startDate) {
        query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(new Date(filters.startDate)));
    }

    if (filters.endDate) {
        query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(new Date(filters.endDate)));
    }

    const snapshot = await query.orderBy('timestamp', 'desc').limit(filters.limit || 100).get();

    if (snapshot.empty) {
        return [];
    }

    // 3. Return only canonical Session-first events.
    // Legacy/incomplete records are excluded rather than assigned fabricated identity
    // or chronology values.
    return snapshot.docs.flatMap(doc => {
        const data = doc.data();

        if (
            typeof data.sessionId !== 'string' || !data.sessionId ||
            typeof data.gtin !== 'string' || !data.gtin ||
            typeof data.campaignId !== 'string' || !data.campaignId ||
            !(data.timestamp instanceof admin.firestore.Timestamp)
        ) {
            return [];
        }

        return [{
            eventId: doc.id,
            sessionId: data.sessionId,
            gtin: data.gtin,
            retailerId: authorizedRetailerId,
            campaignId: data.campaignId,
            timestamp: data.timestamp.toDate().toISOString(),
            userAgent: typeof data.userAgent === 'string' && data.userAgent ? data.userAgent : 'unknown',
            referrer: typeof data.referrer === 'string' ? data.referrer : '',
        }];
    });
  }
);
