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
    
    TASK: Write a 2-3 sentence executive summary describing the shopper decision patterns.
    
    STRICT INTEGRITY RULES:
    1. NO CAUSAL CLAIMS: Do not use "because", "due to", or "resulted in".
    2. NO MANUFACTURED NUMBERS: Use only provided metrics.
    3. LANGUAGE: Use "subsequent purchase", "explicit rejection", and "verified progression".
    4. CHRONOLOGY: Only mention transitions that were timestamp-verified.
    
    DATA:
    {{#if metrics.gtin}}ANALYSING GTIN: {{metrics.gtin}}{{/if}}
    {{#each metrics.funnel}}
    - {{stage}}: {{uniqueSessions}} sessions ({{rate}}%)
    {{/each}}
    - Alt-Product Movements: {{metrics.stats.alternativeProductMovements}}
    - Top Rejection Reason: {{metrics.rejectionBreakdown.[0].reason}}`
});

export async function getDecisionJourneyIntelligence(retailerId: string, daysLookback: number = 30, targetGtin?: string): Promise<DecisionJourneyOutput> {
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
    let recToPurchaseCount = 0;

    // 5. Deterministic Temporal Walk
    Object.entries(sessionsMap).forEach(([sid, activity]) => {
        // Sort by timestamp
        const timeline = activity.sort((a, b) => a.timestamp - b.timestamp);
        
        let hasValidExposure = false;
        let lastExposureTimestamp = 0;
        let activeGtins = new Set<string>();
        let lastRecommendationTimestamp = 0;
        let lastRecommendationGtin: string | null = null;

        // If targetGtin is specified, we ONLY care about sessions that touched this GTIN
        const sessionTouchesTarget = targetGtin 
            ? activity.some(n => n.gtin === targetGtin)
            : true;

        if (!sessionTouchesTarget) return;

        timeline.forEach(node => {
            if (node.timestamp === 0) return; // Skip unresolved timestamps

            // GTIN Boundary: If targetGtin is active, only count metrics for THAT product
            // Except for exposure, which defines the session's reach
            const nodeMatchesTarget = !targetGtin || node.gtin === targetGtin;

            if (node.type === 'event') {
                // EXPOSURE (SCAN or VIEW)
                if (node.eventType === 'scan' || node.eventType === 'view') {
                    if (nodeMatchesTarget) {
                        sessionsExposed.add(sid);
                        hasValidExposure = true;
                        lastExposureTimestamp = node.timestamp;
                    }
                    if (node.gtin) activeGtins.add(node.gtin);
                }

                // RECOMMENDATION (AI Action)
                if (node.eventType === 'recommendation_event' && nodeMatchesTarget) {
                    lastRecommendationTimestamp = node.timestamp;
                    lastRecommendationGtin = node.gtin;
                }

                // SIGNALS (INTEREST, CONSIDERATION, REJECTION)
                // Rule: Must follow Exposure
                if (hasValidExposure && node.timestamp >= lastExposureTimestamp) {
                    if (node.eventType === 'interaction_signal' && node.metadata?.evidenceType !== 'inferred') {
                        const sigType = node.metadata?.type;
                        if (sigType === 'product_interest' && nodeMatchesTarget) sessionsInterested.add(sid);
                        if (sigType === 'product_consideration' && nodeMatchesTarget) sessionsConsidered.add(sid);
                        if (sigType === 'product_rejection' && nodeMatchesTarget) {
                            sessionsRejected.add(sid);
                            const reason = node.metadata?.statedReason || 'Reason not stated';
                            rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
                        }
                    }

                    if (node.eventType === 'add_to_cart' && nodeMatchesTarget) {
                        sessionsBasket.add(sid);
                    }
                }
            } else if (node.type === 'txn') {
                // PURCHASE
                // Rule: Must follow Exposure
                if (hasValidExposure && node.timestamp >= lastExposureTimestamp && nodeMatchesTarget) {
                    sessionsPurchased.add(sid);
                    
                    // Attribution Check: Recommendation -> Purchase
                    if (lastRecommendationTimestamp > 0 && node.timestamp > lastRecommendationTimestamp) {
                        if (node.gtin === lastRecommendationGtin) {
                            recToPurchaseCount++;
                        }
                    }
                }
            }
        });

        // Track Alt-Movement: More than one GTIN in session
        if (activeGtins.size > 1) {
            // For a product profile, alt movement means they looked at something OTHER than the target
            if (targetGtin) {
                if (activeGtins.has(targetGtin) && activeGtins.size > 1) altMovementCount++;
            } else {
                altMovementCount++;
            }
        }
    });

    const totalUniqueSessions = sessionsExposed.size || 0;
    
    if (totalUniqueSessions === 0) {
        return {
            retailerId,
            gtin: targetGtin,
            timeWindow: { start: startTime.toISOString(), end: endTime.toISOString() },
            summary: "Insufficient evidence for this product/period.",
            funnel: [],
            rejectionBreakdown: [],
            stats: { totalUniqueSessions: 0, alternativeProductMovements: 0, recommendationToPurchaseCount: 0, leakagePoints: {} },
            metadata: { aggregationVersion: '1.2.0', dataStatus: 'SIMULATED', evidenceStrength: 'LOW', methodology: 'Empty dataset.' }
        };
    }

    // 6. Calculate Metrics (Percentage of Exposure)
    const funnel = [
        { stage: 'EXPOSURE' as const, uniqueSessions: sessionsExposed.size, numerator: sessionsExposed.size, denominator: totalUniqueSessions, rate: 100, denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'INTEREST' as const, uniqueSessions: sessionsInterested.size, numerator: sessionsInterested.size, denominator: totalUniqueSessions, rate: Math.round((sessionsInterested.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'CONSIDERATION' as const, uniqueSessions: sessionsConsidered.size, numerator: sessionsConsidered.size, denominator: totalUniqueSessions, rate: Math.round((sessionsConsidered.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'REJECTION' as const, uniqueSessions: sessionsRejected.size, numerator: sessionsRejected.size, denominator: totalUniqueSessions, rate: Math.round((sessionsRejected.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'BASKET' as const, uniqueSessions: sessionsBasket.size, numerator: sessionsBasket.size, denominator: totalUniqueSessions, rate: Math.round((sessionsBasket.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'PURCHASE' as const, uniqueSessions: sessionsPurchased.size, numerator: sessionsPurchased.size, denominator: totalUniqueSessions, rate: Math.round((sessionsPurchased.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
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
    const metricsForAi = { gtin: targetGtin, funnel, rejectionBreakdown: sortedRejections, stats: { alternativeProductMovements: altMovementCount } };
    const { output } = await summaryPrompt({ metrics: metricsForAi });

    return {
        retailerId,
        gtin: targetGtin,
        timeWindow: { start: startTime.toISOString(), end: endTime.toISOString() },
        summary: output?.summary || "Factual decision journey analysis complete.",
        funnel,
        rejectionBreakdown: sortedRejections,
        stats: {
            totalUniqueSessions,
            alternativeProductMovements: altMovementCount,
            recommendationToPurchaseCount: recToPurchaseCount,
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
            methodology: 'Strict chronological product-isolated state machine reconstruction.'
        }
    };
}
