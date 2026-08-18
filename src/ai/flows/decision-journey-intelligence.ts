'use server';
/**
 * @fileOverview iNteract Decision-Journey Aggregator.
 * CHRONOLOGICAL INTEGRITY (v1.4.0)
 * Logic: SCAN -> VIEW -> INTEREST -> CONSIDERATION -> PURCHASE.
 * Hardened Rejection & Barrier Intelligence implementation.
 * AUDIT v1.4.1: Strictly non-causal language enforcement.
 * RELIABILITY v1.5.0: Production safety limits and error handling.
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
    You have been provided with CHRONOLOGICALLY VERIFIED JOURNEY METRICS and REJECTION DATA.
    
    TASK: Write a 2-3 sentence summary describing the observed patterns.
    
    STRICT INTEGRITY RULES:
    1. NO CAUSAL CLAIMS: Do not use "because", "due to", "resulted in", or "caused".
    2. NO MANUFACTURED NUMBERS: Use only provided metrics.
    3. LANGUAGE: Use "subsequent purchase", "explicit rejection", "observed sequence", and "verified progression".
    4. BARRIERS: Use "observed barrier" or "explicitly stated factor".
    
    DATA:
    {{#if metrics.gtin}}ANALYSING GTIN: {{metrics.gtin}}{{/if}}
    {{#each metrics.funnel}}
    - {{stage}}: {{uniqueSessions}} sessions ({{rate}}%)
    {{/each}}
    - Top Barrier: {{#if metrics.barriers.[0]}}{{metrics.barriers.[0].barrier}} ({{metrics.barriers.[0].count}} sessions){{else}}None{{/if}}
    - Rejections with Reason: {{metrics.stats.rejectionsWithReason}}
    - Rejections without Reason: {{metrics.stats.rejectionsWithoutReason}}`
});

export async function getDecisionJourneyIntelligence(retailerId: string, daysLookback: number = 30, targetGtin?: string): Promise<DecisionJourneyOutput> {
    const db = getDb();
    if (!db) throw new Error("Intelligence Infrastructure Unavailable.");

    // SAFETY LIMIT: Prevent unbounded memory usage for large retailers
    const MAX_EVENTS = 5000;
    const startTime = subDays(new Date(), daysLookback);
    const endTime = new Date();

    try {
        // 1. Fetch relevant events with production limit
        const eventSnapshot = await db.collection('events')
            .where('retailerId', '==', retailerId)
            .where('timestamp', '>=', startTime)
            .limit(MAX_EVENTS)
            .get();
        
        const allEvents = eventSnapshot.docs.map(d => ({ 
            id: d.id, 
            ...d.data(),
            timestamp: d.data().timestamp?.toDate().getTime() || 0
        }));

        // 2. Fetch transactions with production limit
        const txnSnapshot = await db.collection('transactions')
            .where('retailerId', '==', retailerId)
            .where('timestamp', '>=', startTime)
            .limit(MAX_EVENTS / 2)
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

        const rejectionReasons: Record<string, Set<string>> = {};
        const barrierCounts: Record<string, Set<string>> = {};
        const altMovementTargets: Record<string, { sessions: Set<string>, purchases: Set<string> }> = {};
        
        let rejectionWithReasonCount = 0;
        let rejectionWithoutReasonCount = 0;
        let altMovementCount = 0;
        let recToPurchaseCount = 0;

        // 5. Deterministic Temporal Walk
        Object.entries(sessionsMap).forEach(([sid, activity]) => {
            const timeline = activity.sort((a, b) => a.timestamp - b.timestamp);
            
            let hasValidExposure = false;
            let firstTargetExposureTimestamp = 0;
            let lastRecommendationTimestamp = 0;
            let lastRecommendationGtin: string | null = null;

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

                    // MOVEMENT TRACKING
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

                    // SIGNALS (Hardened)
                    if (hasValidExposure && node.timestamp >= firstTargetExposureTimestamp) {
                        if (node.eventType === 'interaction_signal' && node.metadata?.evidenceType !== 'inferred') {
                            const sigType = node.metadata?.type;
                            
                            // 1. Interest & Consideration
                            if (sigType === 'product_interest' && nodeMatchesTarget) sessionsInterested.add(sid);
                            if (sigType === 'product_consideration' && nodeMatchesTarget) sessionsConsidered.add(sid);
                            
                            // 2. Rejection Logic
                            if (sigType === 'product_rejection' && nodeMatchesTarget) {
                                sessionsRejected.add(sid);
                                const reason = node.metadata?.statedReason || 'Reason not stated';
                                if (!rejectionReasons[reason]) rejectionReasons[reason] = new Set();
                                rejectionReasons[reason].add(sid);
                            }

                            // 3. Barrier Logic
                            const barrierMap: Record<string, string> = {
                                'price_objection': 'Price',
                                'budget_signal': 'Budget',
                                'feature_requirement': 'Feature Mismatch',
                                'availability_question': 'Availability',
                                'product_concern': 'Suitability'
                            };

                            if (barrierMap[sigType] && nodeMatchesTarget) {
                                const bLabel = barrierMap[sigType];
                                if (!barrierCounts[bLabel]) barrierCounts[bLabel] = new Set();
                                barrierCounts[bLabel].add(sid);
                            }
                        }
                        if (node.eventType === 'add_to_cart' && nodeMatchesTarget) sessionsBasket.add(sid);
                    }
                } else if (node.type === 'txn') {
                    if (hasValidExposure && node.timestamp >= firstTargetExposureTimestamp) {
                        if (nodeMatchesTarget) {
                            sessionsPurchased.add(sid);
                            if (lastRecommendationTimestamp > 0 && node.timestamp > lastRecommendationTimestamp && node.gtin === lastRecommendationGtin) {
                                recToPurchaseCount++;
                            }
                        } else if (targetGtin && node.gtin && node.gtin !== targetGtin) {
                            if (altMovementTargets[node.gtin]) {
                                altMovementTargets[node.gtin].purchases.add(sid);
                            }
                        }
                    }
                }
            });

            const uniqueGtins = new Set(activity.map(n => n.gtin).filter(Boolean));
            if (uniqueGtins.size > 1 && (targetGtin ? uniqueGtins.has(targetGtin) : true)) {
                altMovementCount++;
            }
        });

        const totalUniqueSessions = sessionsExposed.size || 0;
        
        if (totalUniqueSessions === 0) {
            return {
                retailerId,
                gtin: targetGtin,
                timeWindow: { start: startTime.toISOString(), end: endTime.toISOString() },
                summary: "Insufficient evidence for this period.",
                funnel: [],
                rejectionBreakdown: [],
                barrierBreakdown: [],
                stats: { totalUniqueSessions: 0, alternativeProductMovements: 0, recommendationToPurchaseCount: 0, leakagePoints: {}, rejectionsWithReason: 0, rejectionsWithoutReason: 0 },
                altProductBreakdown: [],
                metadata: { aggregationVersion: '1.5.0', dataStatus: 'SIMULATED', evidenceStrength: 'LOW', methodology: 'Empty dataset.' }
            };
        }

        // Calculate Rejection Reason Stats
        const sortedRejections = Object.entries(rejectionReasons).map(([reason, sessions]) => ({
            reason,
            count: sessions.size,
            share: Math.round((sessions.size / (sessionsRejected.size || 1)) * 100)
        })).sort((a, b) => b.count - a.count);

        rejectionWithReasonCount = sortedRejections.filter(r => r.reason !== 'Reason not stated').reduce((a, b) => a + b.count, 0);
        rejectionWithoutReasonCount = rejectionReasons['Reason not stated']?.size || 0;

        // Calculate Barrier Stats
        const barrierBreakdown = Object.entries(barrierCounts).map(([barrier, sessions]) => ({
            barrier,
            count: sessions.size,
            share: Math.round((sessions.size / totalUniqueSessions) * 100)
        })).sort((a, b) => b.count - a.count);

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

        const { output } = await summaryPrompt({ metrics: { gtin: targetGtin, funnel, barriers: barrierBreakdown, stats: { rejectionsWithReason: rejectionWithReasonCount, rejectionsWithoutReason: rejectionWithoutReasonCount } } });

        return {
            retailerId,
            gtin: targetGtin,
            timeWindow: { start: startTime.toISOString(), end: endTime.toISOString() },
            summary: output?.summary || "Factual observation complete.",
            funnel,
            rejectionBreakdown: sortedRejections,
            barrierBreakdown,
            altProductBreakdown,
            stats: {
                totalUniqueSessions,
                alternativeProductMovements: altMovementCount,
                recommendationToPurchaseCount: recToPurchaseCount,
                rejectionsWithReason: rejectionWithReasonCount,
                rejectionsWithoutReason: rejectionWithoutReasonCount,
                leakagePoints: {
                    'EXPOSURE_ONLY': totalUniqueSessions - sessionsInterested.size,
                    'INTEREST_ONLY': sessionsInterested.size - sessionsConsidered.size,
                    'CONSIDERATION_ONLY': sessionsConsidered.size - (sessionsBasket.size + sessionsRejected.size),
                }
            },
            metadata: {
                aggregationVersion: '1.5.0',
                dataStatus: 'SIMULATED', 
                evidenceStrength: totalUniqueSessions >= 30 ? 'HIGHER' : totalUniqueSessions >= 10 ? 'MODERATE' : 'LOW',
                methodology: 'Deterministic chronological walk with production safety limits.'
            }
        };
    } catch (error: any) {
        console.error("[DecisionJourneyAggregator] Reliability Failure:", error);
        throw new Error("Failed to process intelligence stream. Scaling limits reached.");
    }
}
