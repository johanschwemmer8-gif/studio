'use server';
/**
 * @fileOverview iNteract Decision-Journey Aggregator.
 * CHRONOLOGICAL INTEGRITY (v1.5.0)
 * AUDIT v1.5.1: Launch Readiness & Reliability Hardening.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDb } from '@/lib/firebase-admin';
import { DecisionJourneyOutputSchema, type DecisionJourneyOutput } from '@/lib/schemas/decision-journey';
import { subDays } from 'date-fns';

const AGGREGATION_VERSION = '1.5.0';

const summaryPrompt = ai.definePrompt({
    name: 'journeySummaryPrompt',
    input: { schema: z.object({ metrics: z.any() }) },
    output: { schema: z.object({ summary: z.string() }) },
    prompt: `You are the iNteract Decision Analyst. 
    You have been provided with CHRONOLOGICALLY VERIFIED JOURNEY METRICS and REJECTION DATA.
    
    TASK: Write a 2-3 sentence summary describing the observed patterns.
    
    STRICT NON-CAUSAL RULES:
    1. NEVER use: "because", "due to", "resulted in", "caused", "generated", "converted".
    2. NEVER use: "lost sale", "abandoned", "failed".
    3. LANGUAGE: Use "subsequent purchase", "explicit rejection", "observed sequence", "associated interaction", and "verified progression".
    4. BARRIERS: Use "observed friction point" or "explicitly stated factor".
    
    DATA:
    {{#if metrics.gtin}}ANALYSING GTIN: {{metrics.gtin}}{{/if}}
    {{#each metrics.funnel}}
    - {{stage}}: {{uniqueSessions}} sessions ({{rate}}%)
    {{/each}}
    - Top Barrier: {{#if metrics.barriers.[0]}}{{metrics.barriers.[0].barrier}} ({{metrics.barriers.[0].count}} sessions){{else}}None recorded{{/if}}
    - Rejections Stated: {{metrics.stats.rejectionsWithReason}}
    - Rejections Unstated: {{metrics.stats.rejectionsWithoutReason}}`
});

export async function getDecisionJourneyIntelligence(retailerId: string, daysLookback: number = 30, targetGtin?: string): Promise<DecisionJourneyOutput> {
    const db = getDb();
    if (!db) throw new Error("Intelligence Infrastructure Unavailable.");

    // PRODUCTION SAFETY: Fetch limit to prevent memory overflow
    const MAX_EVENTS = 5000;
    const startTime = subDays(new Date(), daysLookback);
    const endTime = new Date();

    try {
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

        const txnSnapshot = await db.collection('transactions')
            .where('retailerId', '==', retailerId)
            .where('timestamp', '>=', startTime)
            .limit(MAX_EVENTS / 2)
            .get();
        
        const allTransactions = txnSnapshot.docs.map(d => ({
            ...d.data(),
            timestamp: d.data().timestamp?.toDate().getTime() || 0
        }));

        // 1. Chronological Reconstruction
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

        const sessionsExposed = new Set<string>();
        const sessionsInterested = new Set<string>();
        const sessionsConsidered = new Set<string>();
        const sessionsRejected = new Set<string>();
        const sessionsBasket = new Set<string>();
        const sessionsPurchased = new Set<string>();

        const rejectionReasons: Record<string, Set<string>> = {};
        const barrierCounts: Record<string, Set<string>> = {};
        const altMovementTargets: Record<string, { sessions: Set<string>, purchases: Set<string> }> = {};
        
        let recToPurchaseCount = 0;

        Object.entries(sessionsMap).forEach(([sid, activity]) => {
            const timeline = activity.sort((a, b) => a.timestamp - b.timestamp);
            
            let hasValidExposure = false;
            let firstTargetExposureTimestamp = 0;
            let lastRecommendationTimestamp = 0;
            let lastRecommendationGtin: string | null = null;

            const sessionTouchesTarget = targetGtin ? activity.some(n => n.gtin === targetGtin) : true;
            if (!sessionTouchesTarget) return;

            timeline.forEach(node => {
                if (node.timestamp === 0) return;
                const nodeMatchesTarget = !targetGtin || node.gtin === targetGtin;

                if (node.type === 'event') {
                    if (node.eventType === 'scan' || node.eventType === 'view') {
                        if (nodeMatchesTarget) {
                            sessionsExposed.add(sid);
                            hasValidExposure = true;
                            if (firstTargetExposureTimestamp === 0) firstTargetExposureTimestamp = node.timestamp;
                        }
                    }

                    if (targetGtin && hasValidExposure && node.gtin && node.gtin !== targetGtin && node.timestamp > firstTargetExposureTimestamp) {
                        if (!altMovementTargets[node.gtin]) altMovementTargets[node.gtin] = { sessions: new Set(), purchases: new Set() };
                        altMovementTargets[node.gtin].sessions.add(sid);
                    }

                    if (node.eventType === 'recommendation_event' && nodeMatchesTarget) {
                        lastRecommendationTimestamp = node.timestamp;
                        lastRecommendationGtin = node.gtin;
                    }

                    if (hasValidExposure && node.timestamp >= firstTargetExposureTimestamp) {
                        if (node.eventType === 'interaction_signal' && node.metadata?.evidenceType !== 'inferred') {
                            const sigType = node.metadata?.type;
                            if (sigType === 'product_interest' && nodeMatchesTarget) sessionsInterested.add(sid);
                            if (sigType === 'product_consideration' && nodeMatchesTarget) sessionsConsidered.add(sid);
                            
                            if (sigType === 'product_rejection' && nodeMatchesTarget) {
                                sessionsRejected.add(sid);
                                const reason = node.metadata?.statedReason || 'Reason not stated';
                                if (!rejectionReasons[reason]) rejectionReasons[reason] = new Set();
                                rejectionReasons[reason].add(sid);
                            }

                            const barrierMap: Record<string, string> = { 'price_objection': 'Price', 'budget_signal': 'Budget', 'feature_requirement': 'Feature Mismatch', 'availability_question': 'Availability', 'product_concern': 'Suitability' };
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
                            if (altMovementTargets[node.gtin]) altMovementTargets[node.gtin].purchases.add(sid);
                        }
                    }
                }
            });
        });

        const totalUniqueSessions = sessionsExposed.size || 0;
        if (totalUniqueSessions === 0) {
            return {
                retailerId, gtin: targetGtin, timeWindow: { start: startTime.toISOString(), end: endTime.toISOString() },
                summary: "Insufficient evidence for this period.", funnel: [], rejectionBreakdown: [], barrierBreakdown: [],
                stats: { totalUniqueSessions: 0, alternativeProductMovements: 0, recommendationToPurchaseCount: 0, leakagePoints: {}, rejectionsWithReason: 0, rejectionsWithoutReason: 0 },
                altProductBreakdown: [],
                metadata: { aggregationVersion: AGGREGATION_VERSION, dataStatus: 'SIMULATED', evidenceStrength: 'LOW', methodology: 'Empty dataset walk.' }
            };
        }

        const sortedRejections = Object.entries(rejectionReasons).map(([reason, sessions]) => ({
            reason, count: sessions.size, share: Math.round((sessions.size / (sessionsRejected.size || 1)) * 100)
        })).sort((a, b) => b.count - a.count);

        const barrierBreakdown = Object.entries(barrierCounts).map(([barrier, sessions]) => ({
            barrier, count: sessions.size, share: Math.round((sessions.size / totalUniqueSessions) * 100)
        })).sort((a, b) => b.count - a.count);

        const funnel = [
            { stage: 'EXPOSURE' as const, uniqueSessions: sessionsExposed.size, numerator: sessionsExposed.size, denominator: totalUniqueSessions, rate: 100, denominatorName: 'Total Unique Exposed Sessions' },
            { stage: 'INTEREST' as const, uniqueSessions: sessionsInterested.size, numerator: sessionsInterested.size, denominator: totalUniqueSessions, rate: Math.round((sessionsInterested.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
            { stage: 'CONSIDERATION' as const, uniqueSessions: sessionsConsidered.size, numerator: sessionsConsidered.size, denominator: totalUniqueSessions, rate: Math.round((sessionsConsidered.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
            { stage: 'REJECTION' as const, uniqueSessions: sessionsRejected.size, numerator: sessionsRejected.size, denominator: totalUniqueSessions, rate: Math.round((sessionsRejected.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
            { stage: 'BASKET' as const, uniqueSessions: sessionsBasket.size, numerator: sessionsBasket.size, denominator: totalUniqueSessions, rate: Math.round((sessionsBasket.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
            { stage: 'PURCHASE' as const, uniqueSessions: sessionsPurchased.size, numerator: sessionsPurchased.size, denominator: totalUniqueSessions, rate: Math.round((sessionsPurchased.size / totalUniqueSessions) * 100), denominatorName: 'Total Unique Exposed Sessions' },
        ];

        const { output } = await summaryPrompt({ metrics: { gtin: targetGtin, funnel, barriers: barrierBreakdown, stats: { rejectionsWithReason: sortedRejections.filter(r => r.reason !== 'Reason not stated').reduce((a, b) => a + b.count, 0), rejectionsWithoutReason: rejectionReasons['Reason not stated']?.size || 0 } } });

        return {
            retailerId, gtin: targetGtin, timeWindow: { start: startTime.toISOString(), end: endTime.toISOString() },
            summary: output?.summary || "Factual observation complete.", funnel, rejectionBreakdown: sortedRejections, barrierBreakdown,
            altProductBreakdown: Object.entries(altMovementTargets).map(([gtin, data]) => ({ gtin, uniqueSessions: data.sessions.size, rate: Math.round((data.sessions.size / totalUniqueSessions) * 100), purchaseCount: data.purchases.size })),
            stats: {
                totalUniqueSessions, alternativeProductMovements: Object.keys(altMovementTargets).length, recommendationToPurchaseCount: recToPurchaseCount,
                rejectionsWithReason: sortedRejections.filter(r => r.reason !== 'Reason not stated').reduce((a, b) => a + b.count, 0),
                rejectionsWithoutReason: rejectionReasons['Reason not stated']?.size || 0,
                leakagePoints: { 'EXPOSURE_ONLY': totalUniqueSessions - sessionsInterested.size, 'INTEREST_ONLY': sessionsInterested.size - sessionsConsidered.size, 'CONSIDERATION_ONLY': sessionsConsidered.size - (sessionsBasket.size + sessionsRejected.size) }
            },
            metadata: {
                aggregationVersion: AGGREGATION_VERSION, dataStatus: 'SIMULATED', 
                evidenceStrength: totalUniqueSessions >= 30 ? 'HIGHER' : totalUniqueSessions >= 10 ? 'MODERATE' : 'LOW',
                methodology: 'Launch Ready: Deterministic chronological walk with scale limiting.'
            }
        };
    } catch (error: any) {
        console.error("[DecisionJourneyAggregator] Launch Fault:", error);
        throw new Error("Intelligence stream temporary unavailable. System hardening active.");
    }
}
