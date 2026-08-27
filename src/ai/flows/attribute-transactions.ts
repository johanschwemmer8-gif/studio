'use server';
/**
 * @fileOverview Transactional Journey Attribution Flow.
 * DETERMINISTIC JOIN: Links real /events and /transactions by sessionId.
 * AUDIT VERSION: 2.1.0 (Infrastructure Resilience Optimized)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDb } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';
import { 
  AttributionReportSchema, 
  type AttributionRecord 
} from '@/lib/schemas/attribution';
import { subDays } from 'date-fns';

/**
 * RESILIENCE HELPER: Wraps Firestore read operations in a jittered retry loop.
 * Targets transient Google Cloud Metadata/Auth errors (500, UNKNOWN).
 */
async function fetchWithRetry(query: any, label: string) {
  const maxRetries = 5; // Increased for high-latency environments
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await query.get();
    } catch (error: any) {
      const isTransient = 
        error.message.includes('metadata') || 
        error.message.includes('refresh') || 
        error.message.includes('500') ||
        error.message.includes('UNKNOWN');

      if (isTransient && attempt < maxRetries) {
        const delay = (1000 * Math.pow(2, attempt)) + (Math.random() * 500);
        console.warn(`[Firestore Retry] ${label} attempt ${attempt + 1}/${maxRetries + 1} failed: ${error.message.substring(0, 100)}. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      // Permanent error or retries exhausted
      throw error;
    }
  }
}

export async function attributeTransactions(idToken: string | undefined, retailerId: string, daysLookback: number = 30) {
    return attributeTransactionsFlow({ idToken, retailerId, daysLookback });
}

const attributeTransactionsFlow = ai.defineFlow(
  {
    name: 'attributeTransactionsFlow',
    inputSchema: z.object({
        idToken: z.string().optional(),
        retailerId: z.string(),
        daysLookback: z.number().default(30)
    }),
    outputSchema: AttributionReportSchema,
  },
  async ({ idToken, retailerId, daysLookback }) => {
    const db = getDb();
    if (!db) throw new Error("Infrastructure Unavailable.");

    // 1. Resolve Authoritative Identity
    const authorizedRetailerId = await getAuthorizedRetailerId(idToken, retailerId);
    const startTime = subDays(new Date(), daysLookback);

    try {
        // 2. Fetch all unique sessions for the retailer in period
        const sessionQuery = db.collection('sessions')
            .where('retailerId', '==', authorizedRetailerId)
            .where('startTime', '>=', startTime);
            
        const sessionSnapshot = await fetchWithRetry(sessionQuery, 'Sessions Fetch');

        const sessionIds = sessionSnapshot.docs.map(doc => doc.id);
        
        if (sessionIds.length === 0) {
            return {
                retailerId: authorizedRetailerId,
                totalSessions: 0,
                ariAssistedSessions: 0,
                ariAssistedPurchases: 0,
                records: [],
                dataStatus: 'VERIFIED' as const
            };
        }

        const records: AttributionRecord[] = [];
        let ariAssistedPurchasesCount = 0;

        // 3. Factual Join Pipeline (Scaled for Pilot Volume)
        for (const sessionId of sessionIds) {
            const eventQuery = db.collection('events').where('sessionId', '==', sessionId).orderBy('timestamp', 'asc');
            const txnQuery = db.collection('transactions').where('sessionId', '==', sessionId);

            const [eventSnapshot, txnSnapshot] = await Promise.all([
                fetchWithRetry(eventQuery, `Events Fetch [${sessionId}]`),
                fetchWithRetry(txnQuery, `Transactions Fetch [${sessionId}]`)
            ]);
            
            const events = eventSnapshot.docs.map(d => ({ 
                id: d.id, 
                ...d.data(),
                timestamp: d.data().timestamp?.toDate().toISOString() || new Date().toISOString()
            }));

            const transactions = txnSnapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                timestamp: d.data().timestamp?.toDate().toISOString() || new Date().toISOString()
            }));

            const ariEvents = events.filter(e => e.eventType === 'interaction_signal' || e.eventType === 'recommendation_event');
            const hasAriInteraction = ariEvents.length > 0;

            const baseRecord = {
                attributionId: `attr_${sessionId}`,
                retailerId: authorizedRetailerId,
                sessionId,
                ariInteraction: hasAriInteraction,
                journeyNodes: events.map(e => ({ type: e.eventType as string, timestamp: e.timestamp, gtin: e.gtin as string })),
                dataStatus: 'VERIFIED' as const, 
                attributionVersion: '2.0.0',
                generatedAt: new Date().toISOString()
            };

            if (transactions.length > 0) {
                for (const txn of transactions) {
                    const purchasedGtin = txn.gtin || '00000000000000';
                    const precedingAriEvents = ariEvents.filter(e => e.timestamp < txn.timestamp);
                    let level: AttributionRecord['attributionLevel'] = 'NONE';
                    
                    if (precedingAriEvents.length > 0) {
                        level = 'CONVERSATION';
                        const recommendations = precedingAriEvents.filter(e => 
                            e.eventType === 'recommendation_event' && 
                            e.gtin === purchasedGtin
                        );
                        if (recommendations.length > 0) {
                            level = 'RECOMMENDATION_TO_PURCHASE';
                        }
                        ariAssistedPurchasesCount++;
                    }

                    records.push({
                        ...baseRecord,
                        transactionId: txn.id,
                        purchasedGtin,
                        transactionTimestamp: txn.timestamp,
                        attributionLevel: level
                    });
                }
            } else if (hasAriInteraction) {
                records.push({ ...baseRecord, attributionLevel: 'CONVERSATION' });
            }
        }

        return {
            retailerId: authorizedRetailerId,
            totalSessions: sessionIds.length,
            ariAssistedSessions: sessionIds.filter(id => records.some(r => r.sessionId === id && r.ariInteraction)).length,
            ariAssistedPurchases: ariAssistedPurchasesCount,
            records,
            dataStatus: 'VERIFIED'
        };
    } catch (error: any) {
        console.warn("[Attribution] Persistence Friction:", error.message);
        throw error; // Propagate to allow client-side handling
    }
  }
);
