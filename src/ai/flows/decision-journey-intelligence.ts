'use server';
/**
 * @fileOverview iNteract Decision-Journey Aggregator.
 * OBJECTIVE 12.6: Canonical QR exposure + Session-first behavioural intelligence.
 *
 * Exposure is a QR/POD occurrence and does NOT create a Shopper Session.
 * Qualifying interaction creates the anonymous Session.
 * Behavioural events and transactions are Session-anchored.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDb } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';
import { DecisionJourneyOutputSchema, type DecisionJourneyOutput } from '@/lib/schemas/decision-journey';
import { subDays } from 'date-fns';

const AGGREGATION_VERSION = '1.6.0';

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
    - {{stage}}: {{numerator}} / {{denominator}} ({{rate}}%)
    {{/each}}
    - Top Barrier: {{#if metrics.barriers.[0]}}{{metrics.barriers.[0].barrier}} ({{metrics.barriers.[0].count}} sessions){{else}}None recorded{{/if}}
    - Rejections Stated: {{metrics.stats.rejectionsWithReason}}
    - Rejections Unstated: {{metrics.stats.rejectionsWithoutReason}}`
});

function emptyVerifiedJourney(
    retailerId: string,
    gtin: string | undefined,
    startTime: Date,
    endTime: Date,
    exposureCount: number = 0
): DecisionJourneyOutput {
    return {
        retailerId,
        gtin,
        timeWindow: {
            start: startTime.toISOString(),
            end: endTime.toISOString()
        },
        summary: exposureCount > 0
            ? `Verified QR exposure data is available (${exposureCount} exposure${exposureCount === 1 ? '' : 's'}), but there is not yet sufficient qualifying shopper interaction evidence for behavioural journey metrics.`
            : 'No verified QR exposure or qualifying shopper interaction evidence is available for this period.',
        funnel: [
            {
                stage: 'EXPOSURE',
                uniqueSessions: 0,
                numerator: exposureCount,
                denominator: exposureCount,
                rate: exposureCount > 0 ? 100 : 0,
                denominatorName: 'Total QR Exposures'
            },
            ...(['INTEREST', 'CONSIDERATION', 'REJECTION', 'BASKET', 'PURCHASE'] as const).map(stage => ({
                stage,
                uniqueSessions: 0,
                numerator: 0,
                denominator: exposureCount,
                rate: 0,
                denominatorName: 'Total QR Exposures'
            }))
        ],
        rejectionBreakdown: [],
        barrierBreakdown: [],
        altProductBreakdown: [],
        stats: {
            totalUniqueSessions: 0,
            alternativeProductMovements: 0,
            recommendationToPurchaseCount: 0,
            rejectionsWithReason: 0,
            rejectionsWithoutReason: 0,
            leakagePoints: {
                'EXPOSURE_WITHOUT_QUALIFYING_INTERACTION': exposureCount
            }
        },
        metadata: {
            aggregationVersion: AGGREGATION_VERSION,
            dataStatus: 'VERIFIED',
            evidenceStrength: 'LOW',
            methodology: 'Verified canonical QR exposures and Session-first behavioural evidence. No simulated production fallback.'
        }
    };
}

export async function getDecisionJourneyIntelligence(
    idToken: string | undefined,
    retailerId: string,
    daysLookback: number = 30,
    targetGtin?: string
): Promise<DecisionJourneyOutput> {
    const authorizedRetailerId = await getAuthorizedRetailerId(idToken, retailerId);

    const db = getDb();
    const startTime = subDays(new Date(), daysLookback);
    const endTime = new Date();

    if (!db) {
        throw new Error('INFRASTRUCTURE_UNAVAILABLE');
    }

    const exposureSnapshot = await db.collection('qrExposures')
        .where('retailerId', '==', authorizedRetailerId)
        .where('timestamp', '>=', startTime)
        .limit(5000)
        .get();

    type ExposureRecord = {
        gtin?: string;
        timestamp: number;
    };

    const exposures: ExposureRecord[] = exposureSnapshot.docs.map(d => {
        const data = d.data() as Record<string, unknown>;
        const timestamp = data.timestamp as { toDate?: () => Date } | undefined;
        return {
            ...(typeof data.gtin === 'string' ? { gtin: data.gtin } : {}),
            timestamp: timestamp?.toDate?.().getTime() || 0
        };
    }).filter(exposure =>
        exposure.timestamp > 0 &&
        (!targetGtin || exposure.gtin === targetGtin)
    );

    const exposureCount = exposures.length;

    const sessionSnapshot = await db.collection('sessions')
        .where('retailerId', '==', authorizedRetailerId)
        .where('startedAt', '>=', startTime)
        .limit(5000)
        .get();

    type SessionRecord = {
        sessionId: string;
        entryGtin?: string;
    };

    const sessions: SessionRecord[] = sessionSnapshot.docs.map(d => {
        const data = d.data() as Record<string, unknown>;
        return {
            sessionId: d.id,
            ...(typeof data.entryGtin === 'string' ? { entryGtin: data.entryGtin } : {})
        };
    }).filter(session => !targetGtin || session.entryGtin === targetGtin);

    if (exposureCount === 0 && sessions.length === 0) {
        return emptyVerifiedJourney(authorizedRetailerId, targetGtin, startTime, endTime);
    }

    const sessionIds = new Set(sessions.map(session => session.sessionId));

    const eventSnapshot = await db.collection('events')
        .where('retailerId', '==', authorizedRetailerId)
        .where('timestamp', '>=', startTime)
        .limit(5000)
        .get();

    type JourneyEventRecord = {
        id: string;
        sessionId?: string;
        gtin?: string;
        eventType?: string;
        metadata?: Record<string, unknown>;
        timestamp: number;
        [key: string]: unknown;
    };

    const allEvents: JourneyEventRecord[] = eventSnapshot.docs.map(d => {
        const data = d.data() as Record<string, unknown>;
        const timestamp = data.timestamp as { toDate?: () => Date } | undefined;
        return {
            ...data,
            id: d.id,
            sessionId: typeof data.sessionId === 'string' ? data.sessionId : undefined,
            gtin: typeof data.gtin === 'string' ? data.gtin : undefined,
            eventType: typeof data.eventType === 'string' ? data.eventType : undefined,
            metadata: data.metadata && typeof data.metadata === 'object'
                ? data.metadata as Record<string, unknown>
                : undefined,
            timestamp: timestamp?.toDate?.().getTime() || 0
        } as JourneyEventRecord;
    }).filter((event: JourneyEventRecord) =>
        !!event.sessionId &&
        sessionIds.has(event.sessionId) &&
        (!targetGtin || !event.gtin || event.gtin === targetGtin)
    );

    const txnSnapshot = await db.collection('transactions')
        .where('retailerId', '==', authorizedRetailerId)
        .where('timestamp', '>=', startTime)
        .limit(2500)
        .get();

    type JourneyTransactionRecord = {
        sessionId?: string;
        gtin?: string;
        timestamp: number;
        [key: string]: unknown;
    };

    const allTransactions: JourneyTransactionRecord[] = txnSnapshot.docs.map(d => {
        const data = d.data() as Record<string, unknown>;
        const timestamp = data.timestamp as { toDate?: () => Date } | undefined;
        return {
            ...data,
            sessionId: typeof data.sessionId === 'string' ? data.sessionId : undefined,
            gtin: typeof data.gtin === 'string' ? data.gtin : undefined,
            timestamp: timestamp?.toDate?.().getTime() || 0
        } as JourneyTransactionRecord;
    }).filter((transaction: JourneyTransactionRecord) =>
        !!transaction.sessionId &&
        sessionIds.has(transaction.sessionId) &&
        (!targetGtin || !transaction.gtin || transaction.gtin === targetGtin)
    );

    const sessionsMap: Record<string, any[]> = {};
    sessions.forEach(session => {
        sessionsMap[session.sessionId] = [];
    });
    allEvents.forEach(event => {
        if (!event.sessionId) return;
        sessionsMap[event.sessionId]?.push({ ...event, type: 'event' });
    });
    allTransactions.forEach(transaction => {
        if (!transaction.sessionId) return;
        sessionsMap[transaction.sessionId]?.push({ ...transaction, type: 'txn' });
    });

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
        let lastRecommendationTimestamp = 0;
        let lastRecommendationGtin: string | null = null;

        timeline.forEach(node => {
            if (node.timestamp === 0) return;
            const nodeMatchesTarget = !targetGtin || !node.gtin || node.gtin === targetGtin;

            if (node.type === 'event') {
                if (targetGtin && node.gtin && node.gtin !== targetGtin) {
                    if (!altProductBreakdown[node.gtin]) {
                        altProductBreakdown[node.gtin] = { sessions: new Set(), purchases: new Set() };
                    }
                    altProductBreakdown[node.gtin].sessions.add(sid);
                }

                if (node.eventType === 'recommendation_event' && nodeMatchesTarget) {
                    lastRecommendationTimestamp = node.timestamp;
                    lastRecommendationGtin = node.gtin || null;
                }

                if (node.eventType === 'interaction_signal' && node.metadata?.evidenceType !== 'inferred') {
                    const sigType = node.metadata?.type;

                    if (sigType === 'product_interest' && nodeMatchesTarget) sessionsInterested.add(sid);
                    if (sigType === 'product_consideration' && nodeMatchesTarget) sessionsConsidered.add(sid);

                    if (sigType === 'product_rejection' && nodeMatchesTarget) {
                        sessionsRejected.add(sid);
                        const reason = typeof node.metadata?.statedReason === 'string' && node.metadata.statedReason
                            ? node.metadata.statedReason
                            : 'Reason not stated';
                        if (!rejectionReasons[reason]) rejectionReasons[reason] = new Set();
                        rejectionReasons[reason].add(sid);
                    }

                    const barrierMap: Record<string, string> = {
                        price_objection: 'Price',
                        budget_signal: 'Budget',
                        feature_requirement: 'Feature Mismatch',
                        availability_question: 'Availability',
                        product_concern: 'Suitability'
                    };

                    if (typeof sigType === 'string' && barrierMap[sigType] && nodeMatchesTarget) {
                        const label = barrierMap[sigType];
                        if (!barrierCounts[label]) barrierCounts[label] = new Set();
                        barrierCounts[label].add(sid);
                    }
                }

                if (node.eventType === 'add_to_cart' && nodeMatchesTarget) {
                    sessionsBasket.add(sid);
                }
            } else if (node.type === 'txn') {
                if (nodeMatchesTarget) {
                    sessionsPurchased.add(sid);
                    if (
                        lastRecommendationTimestamp > 0 &&
                        node.timestamp > lastRecommendationTimestamp &&
                        node.gtin === lastRecommendationGtin
                    ) {
                        recToPurchaseCount++;
                    }
                } else if (targetGtin && node.gtin && altProductBreakdown[node.gtin]) {
                    altProductBreakdown[node.gtin].purchases.add(sid);
                }
            }
        });
    });

    if (rejectionReasons['Reason not stated']) {
        const specificReasonSessions = new Set(
            Object.entries(rejectionReasons)
                .filter(([reason]) => reason !== 'Reason not stated')
                .flatMap(([, sessionSet]) => Array.from(sessionSet))
        );
        specificReasonSessions.forEach(sid => rejectionReasons['Reason not stated'].delete(sid));
        if (rejectionReasons['Reason not stated'].size === 0) {
            delete rejectionReasons['Reason not stated'];
        }
    }

    const engagedSessionCount = sessions.length;
    const denominator = exposureCount;

    const sortedRejections = Object.entries(rejectionReasons)
        .map(([reason, sessionSet]) => ({
            reason,
            count: sessionSet.size,
            share: Math.round((sessionSet.size / (sessionsRejected.size || 1)) * 100)
        }))
        .sort((a, b) => b.count - a.count);

    const barrierBreakdown = Object.entries(barrierCounts)
        .map(([barrier, sessionSet]) => ({
            barrier,
            count: sessionSet.size,
            share: Math.round((sessionSet.size / (engagedSessionCount || 1)) * 100)
        }))
        .sort((a, b) => b.count - a.count);

    const rateAgainstExposure = (count: number) =>
        denominator > 0 ? Math.round((count / denominator) * 100) : 0;

    const funnel = [
        {
            stage: 'EXPOSURE' as const,
            uniqueSessions: 0,
            numerator: exposureCount,
            denominator: exposureCount,
            rate: exposureCount > 0 ? 100 : 0,
            denominatorName: 'Total QR Exposures'
        },
        {
            stage: 'INTEREST' as const,
            uniqueSessions: sessionsInterested.size,
            numerator: sessionsInterested.size,
            denominator,
            rate: rateAgainstExposure(sessionsInterested.size),
            denominatorName: 'Total QR Exposures'
        },
        {
            stage: 'CONSIDERATION' as const,
            uniqueSessions: sessionsConsidered.size,
            numerator: sessionsConsidered.size,
            denominator,
            rate: rateAgainstExposure(sessionsConsidered.size),
            denominatorName: 'Total QR Exposures'
        },
        {
            stage: 'REJECTION' as const,
            uniqueSessions: sessionsRejected.size,
            numerator: sessionsRejected.size,
            denominator,
            rate: rateAgainstExposure(sessionsRejected.size),
            denominatorName: 'Total QR Exposures'
        },
        {
            stage: 'BASKET' as const,
            uniqueSessions: sessionsBasket.size,
            numerator: sessionsBasket.size,
            denominator,
            rate: rateAgainstExposure(sessionsBasket.size),
            denominatorName: 'Total QR Exposures'
        },
        {
            stage: 'PURCHASE' as const,
            uniqueSessions: sessionsPurchased.size,
            numerator: sessionsPurchased.size,
            denominator,
            rate: rateAgainstExposure(sessionsPurchased.size),
            denominatorName: 'Total QR Exposures'
        }
    ];

    const { output } = await summaryPrompt({
        metrics: {
            gtin: targetGtin,
            funnel,
            barriers: barrierBreakdown,
            stats: {
                rejectionsWithReason: sortedRejections
                    .filter(record => record.reason !== 'Reason not stated')
                    .reduce((sum, record) => sum + record.count, 0),
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
        summary: output?.summary || 'Factual observation complete.',
        funnel,
        rejectionBreakdown: sortedRejections,
        barrierBreakdown,
        altProductBreakdown: Object.entries(altProductBreakdown).map(([gtin, data]) => ({
            gtin,
            uniqueSessions: data.sessions.size,
            rate: Math.round((data.sessions.size / (engagedSessionCount || 1)) * 100),
            purchaseCount: data.purchases.size
        })),
        stats: {
            totalUniqueSessions: engagedSessionCount,
            alternativeProductMovements: Object.keys(altProductBreakdown).length,
            recommendationToPurchaseCount: recToPurchaseCount,
            rejectionsWithReason: sortedRejections
                .filter(record => record.reason !== 'Reason not stated')
                .reduce((sum, record) => sum + record.count, 0),
            rejectionsWithoutReason: rejectionReasons['Reason not stated']?.size || 0,
            leakagePoints: {
                'EXPOSURE_WITHOUT_QUALIFYING_INTERACTION': Math.max(exposureCount - engagedSessionCount, 0),
                'ENGAGED_WITHOUT_INTEREST_SIGNAL': Math.max(engagedSessionCount - sessionsInterested.size, 0),
                'INTEREST_WITHOUT_CONSIDERATION_SIGNAL': Math.max(sessionsInterested.size - sessionsConsidered.size, 0)
            }
        },
        metadata: {
            aggregationVersion: AGGREGATION_VERSION,
            dataStatus: 'VERIFIED',
            evidenceStrength: engagedSessionCount >= 30 ? 'HIGHER' : engagedSessionCount >= 10 ? 'MODERATE' : 'LOW',
            methodology: 'Canonical QR exposures are counted independently from qualifying Shopper Sessions. Behavioural metrics are Session-first. No deterministic exposure-to-Session attribution is claimed.'
        }
    };
}
