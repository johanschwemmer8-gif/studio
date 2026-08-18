
import { z } from 'genkit';

/**
 * @fileOverview Intelligence Aggregator Schemas.
 * Defines the structure for aggregated retailer evidence and qualified insights.
 */

export const EvidenceStrengthSchema = z.enum(['LOW EVIDENCE', 'MODERATE EVIDENCE', 'HIGHER EVIDENCE'])
  .describe('The reliability of the insight based on sample size and consistency.');

export const InsightTypeSchema = z.enum(['FACT', 'OBSERVATION', 'INTERPRETATION', 'HYPOTHESIS'])
  .describe('FACT: Measured. OBSERVATION: Pattern. INTERPRETATION: Meaning. HYPOTHESIS: Needs validation.');

export const IntelligenceInsightSchema = z.object({
  insightId: z.string(),
  category: z.string().describe('e.g., Purchase Barriers, Product Preferences'),
  type: z.string().describe('The signal type, e.g., price_objection'),
  insightType: InsightTypeSchema,
  statement: z.string().describe('The human-readable finding.'),
  metric: z.object({
    numerator: z.number(),
    denominator: z.number(),
    rate: z.number(),
    label: z.string()
  }),
  evidenceStrength: EvidenceStrengthSchema,
  methodology: z.object({
    uniqueSessionCount: z.number(),
    totalSignalCount: z.number(),
    evidenceTypesIncluded: z.array(z.string()),
    timeWindow: z.object({
        start: z.string(),
        end: z.string()
    })
  }),
  generatedAt: z.string()
});

export type IntelligenceInsight = z.infer<typeof IntelligenceInsightSchema>;

export const AggregateIntelligenceInputSchema = z.object({
  retailerId: z.string(),
  gtin: z.string().optional(),
  daysLookback: z.number().default(30)
});

export const AggregateIntelligenceOutputSchema = z.object({
  summary: z.string(),
  insights: z.array(IntelligenceInsightSchema),
  stats: z.object({
    totalUniqueSessions: z.number(),
    totalSignalsProcessed: z.number()
  })
});
