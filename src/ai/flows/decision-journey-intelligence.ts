'use server';
/**
 * @fileOverview iNteract Decision-Journey Aggregator.
 * CHRONOLOGICAL INTEGRITY (v1.3.0)
 * Logic: SCAN -> VIEW -> INTEREST -> CONSIDERATION -> PURCHASE.
 * Enforces: event.timestamp < subsequentEvent.timestamp.
 * Enforces: GTIN Isolation.
 * Enforces: Alternative Product Movement Tracking.
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
    - Top Subsequent Alternative: {{#if metrics.altProductBreakdown.[0]}}{{metrics.altProductBreakdown.[0].gtin}}{{else}}None{{/if}}`
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
    const altMovementTargets: Record<string, { sessions: Set<string>, purchases: Set<string> }> = {};
    let altMovementCount = 0;
    let recToPurchaseCount = 0;

    // 5. Deterministic Temporal Walk
    Object.entries(sessionsMap).forEach(([sid, activity]) => {
        // Sort by timestamp
        const timeline = activity.sort((a, b) => a.timestamp - b.timestamp);
        
        let hasValidExposure = false;
        let firstTargetExposureTimestamp = 0;
        let lastRecommendationTimestamp = 0;
        let lastRecommendationGtin: string | null = null;

        // If targetGtin is specified, we ONLY care about sessions that touched this GTIN
        const sessionTouchesTarget = targetGtin 
            ? activity.some(n => n.gtin === targetGtin)
            : true;

        if (!sessionTouchesTarget) return;

        timeline.forEach(node => {
            if (node.timestamp === 0) return;

            const nodeMatchesTarget = !targetGtin || node.gtin === targetGtin;

            if (node.type === 'event') {
                // EXPOSURE
                if (node.eventType === 'scan' || node.eventType === 'view') {
                    if (nodeMatchesTarget) {
                        sessionsExposed.add(sid);
                        hasValidExposure = true;
                        if (firstTargetExposureTimestamp === 0) firstTargetExposureTimestamp = node.timestamp;
                    }
                }

                // SUBSEQUENT ALTERNATIVE MOVEMENT
                // Rule: If targetGtin is active, track any DIFFERENT gtin encountered AFTER first target exposure
                if (targetGtin && hasValidExposure && node.gtin && node.gtin !== targetGtin && node.timestamp > firstTargetExposureTimestamp) {
                    if (!altMovementTargets[node.gtin]) {
                        altMovementTargets[node.gtin] = { sessions: new Set(), purchases: new Set() };
                    }
                    altMovementTargets[node.gtin].sessions.add(sid);
                }

                // RECOMMENDATION
                if (node.eventType === 'recommendation_event' && nodeMatchesTarget) {
                    lastRecommendationTimestamp = node.timestamp;
                    lastRecommendationGtin = node.gtin;
                }

                // SIGNALS
                if (hasValidExposure && node.timestamp >= firstTargetExposureTimestamp) {
                    if (node.eventType === 'interaction_signal' && node.metadata?.evidenceType !== 'inferred') {
                        const sigType = node.metadata?.type;
                        if (sigType === 'product_interest' && nodeMatchesTarget) sessionsInterested.add(sid);
                        if (sigType === 'product_consideration' && nodeMatchesTarget) sessionsConsidered.add(sid);
                        if (sigType === 'product_rejection' && nodeMatchesTarget) {
                            sessionsRejected.add(sid);
                            rejectionReasons[node.metadata?.statedReason || 'Reason not stated'] = (rejectionReasons[node.metadata?.statedReason || 'Reason not stated'] || 0) + 1;
                        }
                    }
                    if (node.eventType === 'add_to_cart' && nodeMatchesTarget) sessionsBasket.add(sid);
                }
            } else if (node.type === 'txn') {
                // PURCHASE
                if (hasValidExposure && node.timestamp >= firstTargetExposureTimestamp) {
                    if (nodeMatchesTarget) {
                        sessionsPurchased.add(sid);
                        if (lastRecommendationTimestamp > 0 && node.timestamp > lastRecommendationTimestamp && node.gtin === lastRecommendationGtin) {
                            recToPurchaseCount++;
                        }
                    } else if (targetGtin && node.gtin && node.gtin !== targetGtin) {
                        // Log subsequent purchase of an alternative
                        if (altMovementTargets[node.gtin]) {
                            altMovementTargets[node.gtin].purchases.add(sid);
                        }
                    }
                }
            }
        });

        // Stats: Broad alt-movement (any session touching more than 1 GTIN)
        const uniqueGtins = new Set(activity.map(n => n.gtin).filter(Boolean));
        if (uniqueGtins.size > 1) {
            if (targetGtin) {
                if (uniqueGtins.has(targetGtin)) altMovementCount++;
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
            altProductBreakdown: [],
            stats: { totalUniqueSessions: 0, alternativeProductMovements: 0, recommendationToPurchaseCount: 0, leakagePoints: {} },
            metadata: { aggregationVersion: '1.3.0', dataStatus: 'SIMULATED', evidenceStrength: 'LOW', methodology: 'Empty dataset.' }
        };
    }

    const funnel = [
        { stage: 'EXPOSURE' as const, uniqueSessions: sessionsExposed.size, numerator: sessionsExposed.size, denominator: totalUniqueSessions, rate: 100, denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'INTEREST' as const, uniqueSessions: sessionsInterested.size, numerator: sessionsInterested.size, denominator: totalUniqueSessions, rate: Math.round((sessionsInterested.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'CONSIDERATION' as const, uniqueSessions: sessionsConsidered.size, numerator: sessionsConsidered.size, denominator: totalUniqueSessions, rate: Math.round((sessionsConsidered.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'REJECTION' as const, uniqueSessions: sessionsRejected.size, numerator: sessionsRejected.size, denominator: totalUniqueSessions, rate: Math.round((sessionsRejected.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'BASKET' as const, uniqueSessions: sessionsBasket.size, numerator: sessionsBasket.size, denominator: totalUniqueSessions, rate: Math.round((sessionsBasket.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        { stage: 'PURCHASE' as const, uniqueSessions: sessionsPurchased.size, numerator: sessionsPurchased.size, denominator: totalUniqueSessions, rate: Math.round((sessionsPurchased.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
    ];

    const altProductBreakdown = Object.entries(altMovementTargets).map(([gtin, data]) => ({
        gtin,
        uniqueSessions: data.sessions.size,
        rate: Math.round((data.sessions.size / totalUniqueSessions) * 100),
        purchaseCount: data.purchases.size
    })).sort((a, b) => b.uniqueSessions - a.uniqueSessions);

    const sortedRejections = Object.entries(rejectionReasons).map(([reason, count]) => ({
        reason,
        count,
        share: Math.round((count / (sessionsRejected.size || 1)) * 100)
    })).sort((a, b) => b.count - a.count);

    const { output } = await summaryPrompt({ metrics: { gtin: targetGtin, funnel, altProductBreakdown, stats: { alternativeProductMovements: altMovementCount } } });

    return {
        retailerId,
        gtin: targetGtin,
        timeWindow: { start: startTime.toISOString(), end: endTime.toISOString() },
        summary: output?.summary || "Factual decision journey analysis complete.",
        funnel,
        rejectionBreakdown: sortedRejections,
        altProductBreakdown,
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
            aggregationVersion: '1.3.0',
            dataStatus: 'SIMULATED', 
            evidenceStrength: totalUniqueSessions >= 30 ? 'HIGHER' : totalUniqueSessions >= 10 ? 'MODERATE' : 'LOW',
            methodology: 'Strict chronological state machine with subsequent alternative encounter mapping.'
        }
    };
}
