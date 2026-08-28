'use server';
/**
 * @fileOverview Transactional Journey Attribution Flow.
 * DETERMINISTIC JOIN: Links real /events and /transactions by sessionId.
 * AUDIT VERSION: 3.0.0 (Lineage Integrity Enforced)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDb } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';
import { 
  AttributionReportSchema, 
  type AttributionReport 
} from '@/lib/schemas/attribution';
import { subDays } from 'date-fns';

/**
 * RESILIENCE HELPER: Wraps Firestore read operations in a jittered retry loop.
 */
async function fetchWithRetry(query: any, label: string) {
  const maxRetries = 5;
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
        console.warn(`[Firestore Retry] ${label} attempt ${attempt + 1} failed. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
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
        // 2. Fetch recent transactions for the retailer
        // Lineage Fix: We now prioritize transactions that HAVE a sessionId.
        const txnQuery = db.collection('transactions')
            .where('retailerId', '==', authorizedRetailerId)
            .where('timestamp', '>=', startTime);
            
        const txnSnapshot = await fetchWithRetry(txnQuery, 'Transactions Fetch');
        const allTransactions = txnSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        if (allTransactions.length === 0) {
            return {
                retailerId: authorizedRetailerId,
                totalSessions: 0,
                ariAssistedSessions: 0,
                ariAssistedPurchases: 0,
                records: [],
                dataStatus: 'VERIFIED'
            };
        }

        const records: AttributionRecord[] = [];
        const uniqueSessionsAttributed = new Set<string>();
        let ariAssistedPurchasesCount = 0;

        // 3. Factual Join Pipeline
        for (const txn of allTransactions) {
            const sessionId = (txn as any).sessionId;
            
            // INTEGRITY CHECK: Handle orphan/legacy records
            if (!sessionId) {
                records.push({
                    attributionId: `legacy_${txn.id}`,
                    retailerId: authorizedRetailerId,
                    sessionId: 'legacy_orphan',
                    transactionId: txn.id,
                    ariInteraction: false,
                    attributionLevel: 'NONE',
                    journeyNodes: [],
                    dataStatus: 'SIMULATED', // Cannot verify without lineage
                    generatedAt: new Date().toISOString()
                } as any);
                continue;
            }

            // 4. Trace the Lineage
            const sessionDoc = await db.collection('sessions').doc(sessionId).get();
            const eventQuery = db.collection('events').where('sessionId', '==', sessionId).orderBy('timestamp', 'asc');
            const eventSnapshot = await fetchWithRetry(eventQuery, `Events [${sessionId}]`);
            
            const events = eventSnapshot.docs.map(d => ({ 
                type: d.data().eventType, 
                timestamp: d.data().timestamp?.toDate().toISOString() || '',
                gtin: d.data().gtin 
            }));

            const ariEvents = events.filter(e => e.type === 'interaction_signal' || e.type === 'recommendation_event');
            const hasAriInteraction = ariEvents.length > 0;
            
            let level: any = 'NONE';
            let status: 'VERIFIED' | 'SIMULATED' = 'SIMULATED';

            if (sessionDoc.exists && sessionDoc.data()?.retailerId === authorizedRetailerId) {
                status = 'VERIFIED';
                if (hasAriInteraction) {
                    level = 'CONVERSATION';
                    uniqueSessionsAttributed.add(sessionId);
                    
                    // Recommendation logic
                    const purchasedItems = (txn as any).items || [];
                    const hasPurchasedRecommendation = ariEvents.some(ae => 
                        ae.type === 'recommendation_event' && 
                        purchasedItems.some((pi: any) => pi.gtin === ae.gtin)
                    );

                    if (hasPurchasedRecommendation) {
                        level = 'RECOMMENDATION_TO_PURCHASE';
                        ariAssistedPurchasesCount++;
                    }
                }
            }

            records.push({
                attributionId: `attr_${txn.id}`,
                retailerId: authorizedRetailerId,
                sessionId,
                transactionId: txn.id,
                purchasedGtin: (txn as any).items?.[0]?.gtin,
                transactionTimestamp: (txn as any).timestamp?.toDate().toISOString(),
                ariInteraction: hasAriInteraction,
                attributionLevel: level,
                journeyNodes: events,
                dataStatus: status,
                attributionVersion: '3.0.0',
                generatedAt: new Date().toISOString()
            } as any);
        }

        return {
            retailerId: authorizedRetailerId,
            totalSessions: new Set(records.map(r => r.sessionId)).size,
            ariAssistedSessions: uniqueSessionsAttributed.size,
            ariAssistedPurchases: ariAssistedPurchasesCount,
            records,
            dataStatus: 'VERIFIED'
        };
    } catch (error: any) {
        console.error("[Attribution] Critical failure:", error.message);
        throw error;
    }
  }
);
