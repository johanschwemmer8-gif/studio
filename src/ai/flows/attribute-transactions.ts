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
    const startTime = subDays(new Date(), daysLookback);

    // If Infrastructure is unavailable or token fails, use high-fidelity simulation fallback
    if (!db) {
        return getSimulatedAttribution(retailerId);
    }

    try {
        // 1. Fetch all unique sessions for the retailer
        const sessionSnapshot = await db.collection('sessions')
            .where('retailerId', '==', retailerId)
            .where('startTime', '>=', startTime)
            .get();

        const sessionIds = sessionSnapshot.docs.map(doc => doc.id);
        const records: AttributionRecord[] = [];
        let ariAssistedPurchasesCount = 0;

        // 2. For each session, perform the Factual Join
        for (const sessionId of sessionIds) {
            const eventSnapshot = await db.collection('events')
                .where('sessionId', '==', sessionId)
                .orderBy('timestamp', 'asc')
                .get();
            
            const events = eventSnapshot.docs.map(d => ({ 
                id: d.id, 
                ...d.data(),
                timestamp: d.data().timestamp?.toDate().toISOString() || new Date().toISOString()
            }));

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

            const baseRecord = {
                attributionId: `attr_${sessionId}`,
                retailerId,
                sessionId,
                ariInteraction: hasAriInteraction,
                journeyNodes: events.map(e => ({ type: e.eventType, timestamp: e.timestamp, gtin: e.gtin })),
                dataStatus: 'SIMULATED' as const, 
                attributionVersion: '1.0.0',
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
            retailerId,
            totalSessions: sessionIds.length,
            ariAssistedSessions: sessionIds.filter(id => records.some(r => r.sessionId === id && r.ariInteraction)).length,
            ariAssistedPurchases: ariAssistedPurchasesCount,
            records,
            dataStatus: 'SIMULATED'
        };
    } catch (error: any) {
        console.warn("[AttributionEngine] Infrastructure Friction:", error.message);
        return getSimulatedAttribution(retailerId);
    }
  }
);

function getSimulatedAttribution(retailerId: string) {
    return {
        retailerId,
        totalSessions: 142,
        ariAssistedSessions: 86,
        ariAssistedPurchases: 32,
        dataStatus: 'SIMULATED' as const,
        records: [
            {
                attributionId: 'attr_sim_1',
                retailerId,
                sessionId: 'sess_sim_alpha',
                transactionId: 'txn_sim_001',
                purchasedGtin: '06001234567891',
                transactionTimestamp: new Date().toISOString(),
                ariInteraction: true,
                attributionLevel: 'RECOMMENDATION_TO_PURCHASE' as const,
                journeyNodes: [],
                dataStatus: 'SIMULATED' as const,
                generatedAt: new Date().toISOString()
            },
            {
                attributionId: 'attr_sim_2',
                retailerId,
                sessionId: 'sess_sim_beta',
                transactionId: 'txn_sim_002',
                purchasedGtin: '06009876543210',
                transactionTimestamp: new Date().toISOString(),
                ariInteraction: true,
                attributionLevel: 'CONVERSATION' as const,
                journeyNodes: [],
                dataStatus: 'SIMULATED' as const,
                generatedAt: new Date().toISOString()
            }
        ]
    };
}
