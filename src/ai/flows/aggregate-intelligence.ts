
'use server';
/**
 * @fileOverview iNteract Retailer Intelligence Aggregator.
 * Deterministically calculates metrics from /events and generates grounded insights.
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
    You have been provided with DETERMINISTIC METRICS calculated from verified customer interaction signals.
    
    YOUR TASK: Translate these numbers into human-readable insights.
    
    STRICT RULES:
    1. NO MANUFACTURING: Use ONLY the numbers provided. Do not invent trends or percentages.
    2. NO CAUSAL CLAIMS: Do not say "X caused Y". Say "X co-occurs with Y" or "X is observed in Y% of cases".
    3. TYPES: 
       - OBSERVATION: Describe the pattern (e.g., "Frequent interest in durability").
       - INTERPRETATION: What it might mean (e.g., "Durability appears to be a value driver").
       - HYPOTHESIS: A business guess (e.g., "Highlighting warranty may improve conversion").
    
    METRICS DATA:
    {{#each metrics}}
    - Signal: {{type}} | Rate: {{rate}}% | Sample: {{uniqueSessions}} unique sessions
    {{/each}}
    
    Format the output as a structured analysis.`
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
    
    // 1. Fetch relevant signals (Deterministic Stage)
    let query = db.collection('events')
        .where('retailerId', '==', retailerId)
        .where('eventType', '==', 'interaction_signal')
        .where('timestamp', '>=', startTime);

    if (gtin) query = query.where('gtin', '==', gtin);

    const snapshot = await query.get();
    const events = snapshot.docs.map(d => d.data());

    // 2. Filter: No Inferred Data allowed in factual aggregation
    const validEvents = events.filter(e => e.metadata?.evidenceType !== 'inferred');
    
    // 3. Aggregate by Unique Session
    const allSessions = new Set(events.map(e => e.sessionId));
    const totalUniqueSessions = allSessions.size;

    const signalGroups: Record<string, Set<string>> = {};
    validEvents.forEach(e => {
        const type = e.metadata?.type;
        if (!type) return;
        if (!signalGroups[type]) signalGroups[type] = new Set();
        signalGroups[type].add(e.sessionId);
    });

    // 4. Calculate Deterministic Metrics
    const calculatedMetrics = Object.entries(signalGroups).map(([type, sessions]) => ({
        type,
        uniqueSessions: sessions.size,
        rate: Math.round((sessions.size / (totalUniqueSessions || 1)) * 100),
        totalSignals: validEvents.filter(e => e.metadata?.type === type).length
    }));

    // 5. Generate Grounded Phrasing (LLM Translation Stage)
    // Only pass calculated metrics, not raw conversations.
    const { output } = await aggregatorPrompt({ metrics: calculatedMetrics });

    // 6. Map to Intelligence Objects (Evidence Assessment)
    const insights: IntelligenceInsight[] = calculatedMetrics.map(m => {
        const aiText = output?.insights.find(i => i.type === m.type);
        
        let strength: 'LOW EVIDENCE' | 'MODERATE EVIDENCE' | 'HIGHER EVIDENCE' = 'LOW EVIDENCE';
        if (m.uniqueSessions >= 30) strength = 'HIGHER EVIDENCE';
        else if (m.uniqueSessions >= 10) strength = 'MODERATE EVIDENCE';

        return {
            insightId: `ins_${m.type}_${Date.now()}`,
            category: 'Customer Behavioral Pattern',
            type: m.type,
            insightType: m.uniqueSessions < 10 ? 'HYPOTHESIS' : 'FACT',
            statement: m.uniqueSessions < 10 
                ? "Insufficient sample size for qualified insight."
                : `${m.rate}% of shopping sessions (${m.uniqueSessions}) included a ${m.type.replace(/_/g, ' ')}.`,
            metric: {
                numerator: m.uniqueSessions,
                denominator: totalUniqueSessions,
                rate: m.rate,
                label: 'Unique Session Frequency'
            },
            evidenceStrength: strength,
            methodology: {
                uniqueSessionCount: m.uniqueSessions,
                totalSignalCount: m.totalSignals,
                evidenceTypesIncluded: ['explicit', 'derived'],
                timeWindow: {
                    start: startTime.toISOString(),
                    end: new Date().toISOString()
                }
            },
            generatedAt: new Date().toISOString()
        };
    });

    return {
        summary: output?.summary || "Factual aggregation complete.",
        insights: insights.filter(i => i.methodology.uniqueSessionCount > 0),
        stats: {
            totalUniqueSessions,
            totalSignalsProcessed: validEvents.length
        }
    };
  }
);
