'use server';
/**
 * @fileOverview iNteract Decision-Journey Aggregator.
 * DETERMINISTIC FIRST: Maps the SCAN -> VIEW -> INTEREST -> CONSIDERATION -> PURCHASE chain.
 * INTEGRITY: Excludes inferred signals. Uses unique session anchors.
 * VERSION: 1.0.0
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
    You have been provided with DETERMINISTIC JOURNEY METRICS.
    
    TASK: Write a 2-3 sentence executive summary of the shopper journey.
    
    STRICT RULES:
    1. NO CAUSAL CLAIMS: Do not use "because", "due to", or "resulted in".
    2. NO MANUFACTURED NUMBERS: Use only the provided metrics.
    3. LANGUAGE: Use terms like "subsequent purchase", "explicit rejection", and "journey progression".
    4. ACCURACY: If interest is 15%, state exactly 15%.
    
    DATA:
    {{#each metrics.funnel}}
    - {{stage}}: {{uniqueSessions}} sessions ({{rate}}%)
    {{/each}}
    - Alternative Product Movements: {{metrics.stats.alternativeProductMovements}}
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
    
    const allEvents = eventSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // 2. Fetch ALL transactions for denominator mapping
    const txnSnapshot = await db.collection('transactions')
        .where('retailerId', '==', retailerId)
        .where('timestamp', '>=', startTime)
        .get();
    
    const allTransactions = txnSnapshot.docs.map(d => d.data());

    // 3. Unique Session Sets
    const sessionsExposed = new Set<string>();
    const sessionsInterested = new Set<string>();
    const sessionsConsidered = new Set<string>();
    const sessionsRejected = new Set<string>();
    const sessionsBasket = new Set<string>();
    const sessionsPurchased = new Set<string>();

    const rejectionReasons: Record<string, number> = {};
    const leakagePoints: Record<string, number> = {
        'EXPOSURE_ONLY': 0,
        'INTEREST_ONLY': 0,
        'CONSIDERATION_ONLY': 0,
        'REJECTION_END': 0,
    };

    // 4. Map Events to Session States (GTIN Precision)
    allEvents.forEach((e: any) => {
        const sid = e.sessionId;
        if (!sid) return;

        // Exposure (Scan or View)
        if (e.eventType === 'scan' || e.eventType === 'view') {
            sessionsExposed.add(sid);
        }

        // Filter interaction signals
        if (e.eventType === 'interaction_signal' && e.metadata?.evidenceType !== 'inferred') {
            const type = e.metadata?.type;
            if (type === 'product_interest') sessionsInterested.add(sid);
            if (type === 'product_consideration') sessionsConsidered.add(sid);
            if (type === 'product_rejection') {
                sessionsRejected.add(sid);
                const reason = e.metadata?.statedReason || 'Reason not captured';
                rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
            }
        }

        if (e.eventType === 'add_to_cart') sessionsBasket.add(sid);
    });

    allTransactions.forEach((t: any) => {
        if (t.sessionId) sessionsPurchased.add(t.sessionId);
    });

    const totalUniqueSessions = sessionsExposed.size || 1;

    // 5. Calculate Funnel Stages
    const funnel = [
        { stage: 'EXPOSURE' as const, uniqueSessions: sessionsExposed.size, rate: 100, denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'INTEREST' as const, uniqueSessions: sessionsInterested.size, rate: Math.round((sessionsInterested.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'CONSIDERATION' as const, uniqueSessions: sessionsConsidered.size, rate: Math.round((sessionsConsidered.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'REJECTION' as const, uniqueSessions: sessionsRejected.size, rate: Math.round((sessionsRejected.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'BASKET' as const, uniqueSessions: sessionsBasket.size, rate: Math.round((sessionsBasket.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'PURCHASE' as const, uniqueSessions: sessionsPurchased.size, rate: Math.round((sessionsPurchased.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
    ];

    // 6. Alternative Product Movements (Simplified: Multiple GTINs per session)
    const sessionGtinMap: Record<string, Set<string>> = {};
    allEvents.forEach((e: any) => {
        if (e.sessionId && e.gtin) {
            if (!sessionGtinMap[e.sessionId]) sessionGtinMap[e.sessionId] = new Set();
            sessionGtinMap[e.sessionId].add(e.gtin);
        }
    });
    const altMovementCount = Object.values(sessionGtinMap).filter(gtins => gtins.size > 1).length;

    // 7. Evidence Strength
    let strength: 'LOW' | 'MODERATE' | 'HIGHER' = 'LOW';
    if (totalUniqueSessions >= 30) strength = 'HIGHER';
    else if (totalUniqueSessions >= 10) strength = 'MODERATE';

    // 8. Format Rejections
    const sortedRejections = Object.entries(rejectionReasons)
        .map(([reason, count]) => ({
            reason,
            count,
            share: Math.round((count / (sessionsRejected.size || 1)) * 100)
        }))
        .sort((a, b) => b.count - a.count);

    // 9. LLM Summary
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
                'CONSIDERATION_ONLY': sessionsConsidered.size - sessionsBasket.size,
            }
        },
        metadata: {
            aggregationVersion: '1.0.0',
            dataStatus: 'SIMULATED', // Default for prototype
            evidenceStrength: strength,
            methodology: 'Unique session aggregation from explicit behavioural nodes.'
        }
    };
}
