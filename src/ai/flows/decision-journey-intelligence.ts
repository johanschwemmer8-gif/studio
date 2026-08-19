'use server';
/**
 * @fileOverview iNteract Decision-Journey Aggregator.
 * CHRONOLOGICAL INTEGRITY (v1.5.0)
 * AUDIT v1.5.1: Non-Causal Grounding & Resilience Hardened.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDb } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';
import { DecisionJourneyOutputSchema, type DecisionJourneyOutput } from '@/lib/schemas/decision-journey';
import { subDays } from 'date-fns';

const AGGREGATION_VERSION = '1.5.1';

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

export async function getDecisionJourneyIntelligence(idToken: string | undefined, retailerId: string, daysLookback: number = 30, targetGtin?: string): Promise<DecisionJourneyOutput> {
    // AUTHORIZATION GATE
    const authorizedRetailerId = await getAuthorizedRetailerId(idToken, retailerId);
    
    const db = getDb();
    const startTime = subDays(new Date(), daysLookback);
    const endTime = new Date();

    if (!db) {
        return getSimulatedJourney(authorizedRetailerId, targetGtin, startTime, endTime);
    }

    try {
        const eventSnapshot = await db.collection('events')
            .where('retailerId', '==', authorizedRetailerId)
            .where('timestamp', '>=', startTime)
            .limit(5000)
            .get();
        
        const allEvents = eventSnapshot.docs.map(d => ({ 
            id: d.id, 
            ...d.data(),
            timestamp: d.data().timestamp?.toDate().getTime() || 0
        }));

        const txnSnapshot = await db.collection('transactions')
            .where('retailerId', '==', authorizedRetailerId)
            .where('timestamp', '>=', startTime)
            .limit(2500)
            .get();
        
        const allTransactions = txnSnapshot.docs.map(d => ({
            ...d.data(),
            timestamp: d.data().timestamp?.toDate().getTime() || 0
        }));

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
        const altProductBreakdown: Record<string, { sessions: Set<string>, purchases: Set<string> }> = {};
        
        let recToPurchaseCount = 0;

        Object.entries(sessionsMap).forEach(([sid, activity]) => {
            const timeline = activity.sort((a, b) => a.timestamp - b.timestamp);
            let hasValidExposure = false;
            let firstTargetExposureTimestamp = 0;
            let lastRecommendationTimestamp = 0;
            let lastRecommendationGtin: string | null = null;

            // Session isolation check
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

                    // Alternative Product Movement detection
                    if (targetGtin && hasValidExposure && node.gtin && node.gtin !== targetGtin && node.timestamp > firstTargetExposureTimestamp) {
                        if (!altProductBreakdown[node.gtin]) altProductBreakdown[node.gtin] = { sessions: new Set(), purchases: new Set() };
                        altProductBreakdown[node.gtin].sessions.add(sid);
                    }

                    if (node.eventType === 'recommendation_event' && nodeMatchesTarget) {
                        lastRecommendationTimestamp = node.timestamp;
                        lastRecommendationGtin = node.gtin;
                    }

                    // Behavioral node evaluation (Exposure-First)
                    if (hasValidExposure && node.timestamp >= firstTargetExposureTimestamp) {
                        if (node.eventType === 'interaction_signal' && node.metadata?.evidenceType !== 'inferred') {
                            const sigType = node.metadata?.type;
                            
                            if (sigType === 'product_interest' && nodeMatchesTarget) sessionsInterested.add(sid);
                            if (sigType === 'product_consideration' && nodeMatchesTarget) sessionsConsidered.add(sid);
                            
                            if (sigType === 'product_rejection' && nodeMatchesTarget) {
                                sessionsRejected.add(sid);
                                const reason = node.metadata?.statedReason || 'Reason not stated';
                                
                                // Prioritize specific reasons over generic rejection
                                if (!rejectionReasons[reason]) rejectionReasons[reason] = new Set();
                                rejectionReasons[reason].add(sid);
                            }

                            // Barrier identification
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
                    // Transactional co-occurrence check
                    if (hasValidExposure && node.timestamp >= firstTargetExposureTimestamp) {
                        if (nodeMatchesTarget) {
                            sessionsPurchased.add(sid);
                            // Recommendation to Purchase correlation
                            if (lastRecommendationTimestamp > 0 && node.timestamp > lastRecommendationTimestamp && node.gtin === lastRecommendationGtin) {
                                recToPurchaseCount++;
                            }
                        } else if (targetGtin && node.gtin && node.gtin !== targetGtin) {
                            // Record purchase of alternative product
                            if (altProductBreakdown[node.gtin]) altProductBreakdown[node.gtin].purchases.add(sid);
                        }
                    }
                }
            });
        });

        const totalUniqueSessions = sessionsExposed.size || 0;
        if (totalUniqueSessions === 0) return getSimulatedJourney(authorizedRetailerId, targetGtin, startTime, endTime);

        // Deduplicate rejection reasons: remove 'Reason not stated' if session has a specific reason
        if (rejectionReasons['Reason not stated']) {
            const specificReasonSessions = new Set(
                Object.entries(rejectionReasons)
                    .filter(([r]) => r !== 'Reason not stated')
                    .flatMap(([_, s]) => Array.from(s))
            );
            
            specificReasonSessions.forEach(sid => {
                rejectionReasons['Reason not stated'].delete(sid);
            });
            if (rejectionReasons['Reason not stated'].size === 0) delete rejectionReasons['Reason not stated'];
        }

        const sortedRejections = Object.entries(rejectionReasons).map(([reason, sessions]) => ({
            reason,
            count: sessions.size,
            share: Math.round((sessions.size / (sessionsRejected.size || 1)) * 100)
        })).sort((a, b) => b.count - a.count);

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

        // Factual LLM Summary
        const { output } = await summaryPrompt({
            metrics: {
                gtin: targetGtin,
                funnel,
                barriers: barrierBreakdown,
                stats: {
                    rejectionsWithReason: sortedRejections.filter(r => r.reason !== 'Reason not stated').reduce((a, b) => a + b.count, 0),
                    rejectionsWithoutReason: rejectionReasons['Reason not stated']?.size || 0
                }
            }
        });

        return {
            retailerId: authorizedRetailerId,
            gtin: targetGtin,
            timeWindow: {
                start: startTime.toISOString(),
                end: endTime.toISOString()
            },
            summary: output?.summary || "Factual observation complete.",
            funnel,
            rejectionBreakdown: sortedRejections,
            barrierBreakdown,
            altProductBreakdown: Object.entries(altProductBreakdown).map(([gtin, data]) => ({
                gtin,
                uniqueSessions: data.sessions.size,
                rate: Math.round((data.sessions.size / totalUniqueSessions) * 100),
                purchaseCount: data.purchases.size
            })),
            stats: {
                totalUniqueSessions,
                alternativeProductMovements: Object.keys(altProductBreakdown).length,
                recommendationToPurchaseCount: recToPurchaseCount,
                rejectionsWithReason: sortedRejections.filter(r => r.reason !== 'Reason not stated').reduce((a, b) => a + b.count, 0),
                rejectionsWithoutReason: rejectionReasons['Reason not stated']?.size || 0,
                leakagePoints: {
                    'EXPOSURE_ONLY': totalUniqueSessions - sessionsInterested.size,
                    'INTEREST_ONLY': sessionsInterested.size - sessionsConsidered.size,
                    'CONSIDERATION_ONLY': sessionsConsidered.size - (sessionsBasket.size + sessionsRejected.size)
                }
            },
            metadata: {
                aggregationVersion: AGGREGATION_VERSION,
                dataStatus: 'VERIFIED',
                evidenceStrength: totalUniqueSessions >= 30 ? 'HIGHER' : totalUniqueSessions >= 10 ? 'MODERATE' : 'LOW',
                methodology: 'Launch Ready: Deterministic chronological walk with scale limiting.'
            }
        };
    } catch (error: any) {
        console.warn("[DecisionJourneyAggregator] Infrastructure Friction:", error.message);
        return getSimulatedJourney(authorizedRetailerId, targetGtin, startTime, endTime);
    }
}

function getSimulatedJourney(retailerId: string, gtin: string | undefined, startTime: Date, endTime: Date): DecisionJourneyOutput {
    return {
        retailerId,
        gtin,
        timeWindow: {
            start: startTime.toISOString(),
            end: endTime.toISOString()
        },
        summary: "Simulated observations based on typical pilot patterns. LIVE data synchronization pending infrastructure handshake.",
        funnel: [
            { stage: 'EXPOSURE', uniqueSessions: 120, numerator: 120, denominator: 120, rate: 100, denominatorName: 'Total Unique Exposed Sessions' },
            { stage: 'INTEREST', uniqueSessions: 84, numerator: 84, denominator: 120, rate: 70, denominatorName: 'Total Unique Exposed Sessions' },
            { stage: 'CONSIDERATION', uniqueSessions: 52, numerator: 52, denominator: 120, rate: 43, denominatorName: 'Total Unique Exposed Sessions' },
            { stage: 'REJECTION', uniqueSessions: 18, numerator: 18, denominator: 120, rate: 15, denominatorName: 'Total Unique Exposed Sessions' },
            { stage: 'BASKET', uniqueSessions: 24, numerator: 24, denominator: 120, rate: 20, denominatorName: 'Total Unique Exposed Sessions' },
            { stage: 'PURCHASE', uniqueSessions: 14, numerator: 14, denominator: 120, rate: 12, denominatorName: 'Total Unique Exposed Sessions' },
        ],
        rejectionBreakdown: [
            { reason: 'Price', count: 12, share: 67 },
            { reason: 'Reason not stated', count: 6, share: 33 }
        ],
        barrierBreakdown: [
            { barrier: 'Price', count: 32, share: 27 },
            { barrier: 'Availability', count: 14, share: 12 }
        ],
        altProductBreakdown: [],
        stats: {
            totalUniqueSessions: 120,
            alternativeProductMovements: 8,
            recommendationToPurchaseCount: 4,
            rejectionsWithReason: 12,
            rejectionsWithoutReason: 6,
            leakagePoints: {
                'EXPOSURE_ONLY': 36,
                'INTEREST_ONLY': 32
            }
        },
        metadata: {
            aggregationVersion: AGGREGATION_VERSION,
            dataStatus: 'SIMULATED',
            evidenceStrength: 'MODERATE',
            methodology: 'Simulation: High-fidelity pattern fallback.'
        }
    };
}
