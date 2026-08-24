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

    // 3. Map to Standard Schema
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            eventId: doc.id,
            sessionId: data.sessionId || 'legacy',
            gtin: data.gtin || '00000000000000',
            retailerId: data.retailerId,
            campaignId: data.campaignId || 'unassigned',
            timestamp: data.timestamp instanceof admin.firestore.Timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
            userAgent: data.userAgent || 'unknown',
            referrer: data.referrer || '',
        };
    });
  }
);
