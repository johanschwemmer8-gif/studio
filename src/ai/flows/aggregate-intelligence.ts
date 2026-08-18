
'use server';
/**
 * @fileOverview iNteract Retailer Intelligence Aggregator.
 * DETERMINISTIC FIRST: Calculates metrics from /events and /sessions.
 * INFERENCE GUARD: Explicitly excludes 'inferred' signals from factual counts.
 * AUDIT VERSION: 1.1.0
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDb } from '@/lib/firebase-admin';
import { 
  AggregateIntelligenceInputSchema, 
  AggregateIntelligenceOutputSchema,
  type IntelligenceInsight 
} from '@/lib/schemas/intelligence-aggregator';
import { subDays } from 'date-fns';

export async function aggregateIntelligence(input: z.infer<typeof AggregateIntelligenceInputSchema>) {
    return aggregateIntelligenceFlow(input);
}

const aggregatorPrompt = ai.definePrompt({
    name: 'aggregatorPrompt',
    input: { schema: z.object({ metrics: z.array(z.any()) }) },
    output: { schema: z.object({ 
        summary: z.string(),
        insights: z.array(z.object({
            type: z.string(),
            observation: z.string(),
            interpretation: z.string(),
            hypothesis: z.string()
        }))
    })},
    prompt: `You are the iNteract Intelligence Analyst. 
    You have been provided with DETERMINISTIC METRICS calculated from verified interaction signals.
    
    YOUR TASK: Translate these numbers into professional, human-readable insights for a retailer dashboard.
    
    STRICT INTEGRITY RULES:
    1. NO MANUFACTURING: Use ONLY the numbers provided. Do not invent trends or percentages.
    2. NO CAUSAL CLAIMS: Do not use words like "because", "due to", or "caused". Use "co-occurs with", "is observed in", or "presents as".
    3. PHRASING CONSTRAINTS: 
       - OBSERVATION: Describe the pattern clearly (e.g., "Price objections appear in 15% of sessions").
       - INTERPRETATION: Explain what this likely means for the store (e.g., "This suggests price may be a barrier for some shoppers").
       - HYPOTHESIS: Propose a testable theory (e.g., "Testing a loyalty discount may influence this pattern").
    4. ACCURACY: If a signal occurs in 18% of sessions, you must state exactly 18%.
    
    METRICS DATA:
    {{#each metrics}}
    - Signal: {{type}} | Rate: {{rate}}% | Sample: {{uniqueSessions}} unique sessions out of {{denominator}} total
    {{/each}}
    
    Format the output as a structured analysis for each signal type.`
});

const aggregateIntelligenceFlow = ai.defineFlow(
  {
    name: 'aggregateIntelligenceFlow',
    inputSchema: AggregateIntelligenceInputSchema,
    outputSchema: AggregateIntelligenceOutputSchema,
  },
  async ({ retailerId, gtin, daysLookback }) => {
    const db = getDb();
    if (!db) throw new Error("Infrastructure Layer Unavailable.");

    const startTime = subDays(new Date(), daysLookback);
    const endTime = new Date();
    
    // 1. Fetch Total Sessions (The Denominator)
    // Rule: Denominator must be all unique shopping sessions in the period.
    let sessionQuery = db.collection('sessions')
        .where('retailerId', '==', retailerId)
        .where('startTime', '>=', startTime);
    
    if (gtin) sessionQuery = sessionQuery.where('entryGtin', '==', gtin);
    
    const sessionSnapshot = await sessionQuery.get();
    const totalUniqueSessions = sessionSnapshot.size || 1; // Prevent division by zero

    // 2. Fetch Relevant Interaction Signals (The Numerator)
    let signalQuery = db.collection('events')
        .where('retailerId', '==', retailerId)
        .where('eventType', '==', 'interaction_signal')
        .where('timestamp', '>=', startTime);

    if (gtin) signalQuery = signalQuery.where('gtin', '==', gtin);

    const signalSnapshot = await signalQuery.get();
    const allSignals = signalSnapshot.docs.map(d => d.data());

    // 3. HARDENED FILTER: Exclude 'inferred' signals from factual aggregation
    const validatedSignals = allSignals.filter(e => e.metadata?.evidenceType !== 'inferred');
    
    // 4. Aggregate by Unique Session to prevent duplicate message bias
    const signalGroups: Record<string, Set<string>> = {};
    validatedSignals.forEach(e => {
        const type = e.metadata?.type;
        if (!type) return;
        if (!signalGroups[type]) signalGroups[type] = new Set();
        signalGroups[type].add(e.sessionId);
    });

    // 5. Calculate Deterministic Metrics
    const calculatedMetrics = Object.entries(signalGroups).map(([type, sessions]) => ({
        type,
        uniqueSessions: sessions.size,
        denominator: totalUniqueSessions,
        rate: Math.round((sessions.size / totalUniqueSessions) * 100),
        totalRawSignals: validatedSignals.filter(e => e.metadata?.type === type).length
    }));

    // 6. Zero Evidence Guard
    if (calculatedMetrics.length === 0) {
        return {
            summary: "Insufficient evidence collected during this period to generate qualified intelligence.",
            insights: [],
            stats: {
                totalUniqueSessions,
                totalSignalsProcessed: validatedSignals.length
            }
        };
    }

    // 7. Grounded LLM Translation
    const { output } = await aggregatorPrompt({ metrics: calculatedMetrics });

    // 8. Map to Qualified Intelligence Objects
    const insights: IntelligenceInsight[] = calculatedMetrics.map(m => {
        const aiText = output?.insights.find(i => i.type === m.type);
        
        // Define Evidence Strength based on sample size
        let strength: 'LOW EVIDENCE' | 'MODERATE EVIDENCE' | 'HIGHER EVIDENCE' = 'LOW EVIDENCE';
        let insightType: 'FACT' | 'OBSERVATION' | 'INTERPRETATION' | 'HYPOTHESIS' = 'HYPOTHESIS';

        if (m.uniqueSessions >= 30) {
            strength = 'HIGHER EVIDENCE';
            insightType = 'FACT';
        } else if (m.uniqueSessions >= 10) {
            strength = 'MODERATE EVIDENCE';
            insightType = 'OBSERVATION';
        }

        return {
            insightId: `ins_${m.type}_${Date.now()}`,
            category: 'Shopper Behavioral Pattern',
            type: m.type,
            insightType,
            statement: aiText?.observation || `${m.rate}% of sessions included an explicit ${m.type.replace(/_/g, ' ')}.`,
            metric: {
                numerator: m.uniqueSessions,
                denominator: totalUniqueSessions,
                rate: m.rate,
                label: 'Session Frequency'
            },
            evidenceStrength: strength,
            methodology: {
                uniqueSessionCount: m.uniqueSessions,
                totalSignalCount: m.totalRawSignals,
                evidenceTypesIncluded: ['explicit', 'derived'],
                aggregationVersion: '1.1.0',
                timeWindow: {
                    start: startTime.toISOString(),
                    end: endTime.toISOString()
                }
            },
            generatedAt: new Date().toISOString()
        };
    });

    return {
        summary: output?.summary || "Evidence-based aggregation complete.",
        insights: insights.filter(i => i.methodology.uniqueSessionCount > 0),
        stats: {
            totalUniqueSessions,
            totalSignalsProcessed: validatedSignals.length
        }
    };
  }
);
