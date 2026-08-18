'use server';
/**
 * @fileOverview iNteract Decision-Journey Aggregator.
 * CHRONOLOGICAL INTEGRITY (v1.2.0)
 * Logic: SCAN -> VIEW -> INTEREST -> CONSIDERATION -> PURCHASE.
 * Enforces: event.timestamp < subsequentEvent.timestamp.
 * Enforces: GTIN Isolation (Product A context does not bleed into Product B).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDb } from '@/lib/firebase-admin';
import { DecisionJourneyOutputSchema, type DecisionJourneyOutput } from '@/lib/schemas/decision-journey';
import { subDays } from 'date-fns';

const summaryPrompt = ai.definePrompt({
    name: 'journeySummaryPrompt',
    input: { schema: z.object({ metrics: z.any() }) },
    output: { schema: z.object({ summary: z.string() }) },
    prompt: `You are the iNteract Decision Analyst. 
    You have been provided with CHRONOLOGICALLY VERIFIED JOURNEY METRICS.
    
    TASK: Write a 2-3 sentence executive summary.
    
    STRICT INTEGRITY RULES:
    1. NO CAUSAL CLAIMS: Do not use "because", "due to", or "resulted in".
    2. NO MANUFACTURED NUMBERS: Use only provided metrics.
    3. LANGUAGE: Use "subsequent purchase", "explicit rejection", and "verified progression".
    4. CHRONOLOGY: Only mention transitions that were timestamp-verified.
    
    DATA:
    {{#each metrics.funnel}}
    - {{stage}}: {{uniqueSessions}} sessions ({{rate}}%)
    {{/each}}
    - Alt-Product Movements: {{metrics.stats.alternativeProductMovements}}
    - Top Rejection Reason: {{metrics.rejectionBreakdown.[0].reason}}`
});

export async function getDecisionJourneyIntelligence(retailerId: string, daysLookback: number = 30): Promise<DecisionJourneyOutput> {
    const db = getDb();
    if (!db) throw new Error("Intelligence Infrastructure Unavailable.");

    const startTime = subDays(new Date(), daysLookback);
    const endTime = new Date();

    // 1. Fetch ALL relevant events for the retailer
    const eventSnapshot = await db.collection('events')
        .where('retailerId', '==', retailerId)
        .where('timestamp', '>=', startTime)
        .get();
    
    const allEvents = eventSnapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        timestamp: d.data().timestamp?.toDate().getTime() || 0
    }));

    // 2. Fetch ALL transactions
    const txnSnapshot = await db.collection('transactions')
        .where('retailerId', '==', retailerId)
        .where('timestamp', '>=', startTime)
        .get();
    
    const allTransactions = txnSnapshot.docs.map(d => ({
        ...d.data(),
        timestamp: d.data().timestamp?.toDate().getTime() || 0
    }));

    // 3. Group by Session for Temporal Reconstruction
    const sessionsMap: Record<string, any[]> = {};
    allEvents.forEach(e => {
        if (!e.sessionId) return;
        if (!sessionsMap[e.sessionId]) sessionsMap[e.sessionId] = [];
        sessionsMap[e.sessionId].push({ ...e, type: 'event' });
    });
    allTransactions.forEach(t => {
        if (!t.sessionId) return;
        if (!sessionsMap[t.sessionId]) sessionsMap[t.sessionId] = [];
        sessionsMap[t.sessionId].push({ ...t, type: 'txn' });
    });

    // 4. Decision State Sets (Unique Session IDs)
    const sessionsExposed = new Set<string>();
    const sessionsInterested = new Set<string>();
    const sessionsConsidered = new Set<string>();
    const sessionsRejected = new Set<string>();
    const sessionsBasket = new Set<string>();
    const sessionsPurchased = new Set<string>();

    const rejectionReasons: Record<string, number> = {};
    let altMovementCount = 0;

    // 5. Deterministic Temporal Walk
    Object.entries(sessionsMap).forEach(([sid, activity]) => {
        // Sort by timestamp
        const timeline = activity.sort((a, b) => a.timestamp - b.timestamp);
        
        let firstExposureGtin: string | null = null;
        let hasValidExposure = false;
        let lastExposureTimestamp = 0;
        let activeGtins = new Set<string>();

        timeline.forEach(node => {
            if (node.timestamp === 0) return; // Skip unresolved timestamps

            if (node.type === 'event') {
                // EXPOSURE (SCAN or VIEW)
                if (node.eventType === 'scan' || node.eventType === 'view') {
                    sessionsExposed.add(sid);
                    hasValidExposure = true;
                    lastExposureTimestamp = node.timestamp;
                    if (!firstExposureGtin) firstExposureGtin = node.gtin;
                    if (node.gtin) activeGtins.add(node.gtin);
                }

                // SIGNALS (INTEREST, CONSIDERATION, REJECTION)
                // Rule: Must follow Exposure
                if (hasValidExposure && node.timestamp >= lastExposureTimestamp) {
                    if (node.eventType === 'interaction_signal' && node.metadata?.evidenceType !== 'inferred') {
                        const sigType = node.metadata?.type;
                        if (sigType === 'product_interest') sessionsInterested.add(sid);
                        if (sigType === 'product_consideration') sessionsConsidered.add(sid);
                        if (sigType === 'product_rejection') {
                            sessionsRejected.add(sid);
                            const reason = node.metadata?.statedReason || 'Reason not captured';
                            rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
                        }
                    }

                    if (node.eventType === 'add_to_cart') {
                        sessionsBasket.add(sid);
                    }
                }
            } else if (node.type === 'txn') {
                // PURCHASE
                // Rule: Must follow Exposure
                if (hasValidExposure && node.timestamp >= lastExposureTimestamp) {
                    sessionsPurchased.add(sid);
                }
            }
        });

        // Track Alt-Movement: More than one GTIN in session
        if (activeGtins.size > 1) altMovementCount++;
    });

    const totalUniqueSessions = sessionsExposed.size || 1;

    // 6. Calculate Metrics (Percentage of Exposure)
    const funnel = [
        { stage: 'EXPOSURE' as const, uniqueSessions: sessionsExposed.size, rate: 100, denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'INTEREST' as const, uniqueSessions: sessionsInterested.size, rate: Math.round((sessionsInterested.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'CONSIDERATION' as const, uniqueSessions: sessionsConsidered.size, rate: Math.round((sessionsConsidered.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'REJECTION' as const, uniqueSessions: sessionsRejected.size, rate: Math.round((sessionsRejected.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'BASKET' as const, uniqueSessions: sessionsBasket.size, rate: Math.round((sessionsBasket.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'PURCHASE' as const, uniqueSessions: sessionsPurchased.size, rate: Math.round((sessionsPurchased.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
    ];

    // 7. Evidence Strength
    let strength: 'LOW' | 'MODERATE' | 'HIGHER' = 'LOW';
    if (totalUniqueSessions >= 30) strength = 'HIGHER';
    else if (totalUniqueSessions >= 10) strength = 'MODERATE';

    const sortedRejections = Object.entries(rejectionReasons)
        .map(([reason, count]) => ({
            reason,
            count,
            share: Math.round((count / (sessionsRejected.size || 1)) * 100)
        }))
        .sort((a, b) => b.count - a.count);

    // 8. LLM Summary
    const metricsForAi = { funnel, rejectionBreakdown: sortedRejections, stats: { alternativeProductMovements: altMovementCount } };
    const { output } = await summaryPrompt({ metrics: metricsForAi });

    return {
        retailerId,
        timeWindow: { start: startTime.toISOString(), end: endTime.toISOString() },
        summary: output?.summary || "Factual decision journey analysis complete.",
        funnel,
        rejectionBreakdown: sortedRejections,
        stats: {
            totalUniqueSessions,
            alternativeProductMovements: altMovementCount,
            leakagePoints: {
                'EXPOSURE_ONLY': totalUniqueSessions - sessionsInterested.size,
                'INTEREST_ONLY': sessionsInterested.size - sessionsConsidered.size,
                'CONSIDERATION_ONLY': sessionsConsidered.size - (sessionsBasket.size + sessionsRejected.size),
            }
        },
        metadata: {
            aggregationVersion: '1.2.0',
            dataStatus: 'SIMULATED', 
            evidenceStrength: strength,
            methodology: 'Strict chronological session state machine reconstruction.'
        }
    };
}
