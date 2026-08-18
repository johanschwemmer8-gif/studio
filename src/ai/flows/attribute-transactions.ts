
'use server';
/**
 * @fileOverview Transactional Journey Attribution Flow.
 * DETERMINISTIC JOIN: Links /events and /transactions by sessionId.
 * CAUSAL GUARD: Strictly non-causal terminology and temporal ordering.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDb } from '@/lib/firebase-admin';
import { 
  AttributionReportSchema, 
  type AttributionRecord 
} from '@/lib/schemas/attribution';
import { subDays } from 'date-fns';

export async function attributeTransactions(retailerId: string, daysLookback: number = 30) {
    return attributeTransactionsFlow({ retailerId, daysLookback });
}

const attributeTransactionsFlow = ai.defineFlow(
  {
    name: 'attributeTransactionsFlow',
    inputSchema: z.object({
        retailerId: z.string(),
        daysLookback: z.number().default(30)
    }),
    outputSchema: AttributionReportSchema,
  },
  async ({ retailerId, daysLookback }) => {
    const db = getDb();
    if (!db) throw new Error("Infrastructure Layer Unavailable.");

    const startTime = subDays(new Date(), daysLookback);

    // 1. Fetch all unique sessions for the retailer
    const sessionSnapshot = await db.collection('sessions')
        .where('retailerId', '==', retailerId)
        .where('startTime', '>=', startTime)
        .get();

    const sessionIds = sessionSnapshot.docs.map(doc => doc.id);
    const records: AttributionRecord[] = [];
    let ariAssistedPurchasesCount = 0;

    // 2. For each session, perform the Factual Join
    // Optimization: In production, this would be a map-reduce or triggered by a purchase event.
    for (const sessionId of sessionIds) {
        // Fetch all events for this session
        const eventSnapshot = await db.collection('events')
            .where('sessionId', '==', sessionId)
            .orderBy('timestamp', 'asc')
            .get();
        
        const events = eventSnapshot.docs.map(d => ({ 
            id: d.id, 
            ...d.data(),
            timestamp: d.data().timestamp?.toDate().toISOString() || new Date().toISOString()
        }));

        // Fetch all transactions for this session
        const txnSnapshot = await db.collection('transactions')
            .where('sessionId', '==', sessionId)
            .get();
        
        const transactions = txnSnapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            timestamp: d.data().timestamp?.toDate().toISOString() || new Date().toISOString()
        }));

        const ariEvents = events.filter(e => e.eventType === 'interaction_signal' || e.eventType === 'recommendation_event');
        const hasAriInteraction = ariEvents.length > 0;

        // Base record structure
        const baseRecord = {
            attributionId: `attr_${sessionId}`,
            retailerId,
            sessionId,
            ariInteraction: hasAriInteraction,
            journeyNodes: events.map(e => ({ type: e.eventType, timestamp: e.timestamp, gtin: e.gtin })),
            dataStatus: 'SIMULATED' as const, // POS is currently simulated in this prototype
            attributionVersion: '1.0.0',
            generatedAt: new Date().toISOString()
        };

        if (transactions.length > 0) {
            for (const txn of transactions) {
                const purchasedGtin = txn.gtin || '00000000000000';
                
                // Temporal Order Check: Did a relevant Ari event happen BEFORE this transaction?
                const precedingAriEvents = ariEvents.filter(e => e.timestamp < txn.timestamp);
                
                let level: AttributionRecord['attributionLevel'] = 'NONE';
                
                if (precedingAriEvents.length > 0) {
                    level = 'CONVERSATION';
                    
                    // Check for GTIN-specific recommendation
                    const recommendations = precedingAriEvents.filter(e => 
                        e.eventType === 'recommendation_event' && 
                        e.gtin === purchasedGtin
                    );

                    if (recommendations.length > 0) {
                        level = 'RECOMMENDATION_TO_PURCHASE';
                        
                        // Check for explicit acceptance
                        const acceptance = events.find(e => 
                            e.eventType === 'interaction_signal' && 
                            e.metadata?.type === 'recommendation_response' &&
                            e.metadata?.value === 'accepted' &&
                            e.gtin === purchasedGtin &&
                            e.timestamp < txn.timestamp
                        );

                        if (acceptance) {
                            level = 'RECOMMENDATION_ACCEPTED';
                        }
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
            // Log Ari-assisted session with no purchase
            records.push({
                ...baseRecord,
                attributionLevel: 'CONVERSATION'
            });
        }
    }

    return {
        retailerId,
        totalSessions: sessionIds.length,
        ariAssistedSessions: sessionIds.filter(id => records.some(r => r.sessionId === id && r.ariInteraction)).length,
        ariAssistedPurchases: ariAssistedPurchasesCount,
        records,
        dataStatus: 'SIMULATED'
    };
  }
);
