
import { z } from 'genkit';

/**
 * @fileOverview Intelligence Aggregator Schemas.
 * Defines the structure for aggregated retailer evidence and qualified insights.
 * VERSION: 1.1.0 (Audit Hardened)
 */

export const EvidenceStrengthSchema = z.enum(['LOW EVIDENCE', 'MODERATE EVIDENCE', 'HIGHER EVIDENCE'])
  .describe('The reliability of the insight based on sample size and consistency.');

export const InsightTypeSchema = z.enum(['FACT', 'OBSERVATION', 'INTERPRETATION', 'HYPOTHESIS'])
  .describe('FACT: Measured calculation. OBSERVATION: Pattern description. INTERPRETATION: Logical meaning. HYPOTHESIS: Needs further evidence.');

export const IntelligenceInsightSchema = z.object({
  insightId: z.string(),
  category: z.string().describe('e.g., Purchase Barriers, Product Preferences'),
  type: z.string().describe('The signal type, e.g., price_objection'),
  insightType: InsightTypeSchema,
  statement: z.string().describe('The human-readable finding, strictly constrained to the evidence.'),
  metric: z.object({
    numerator: z.number().int().describe('Unique sessions containing the signal.'),
    denominator: z.number().int().describe('Total relevant shopping sessions in the period.'),
    rate: z.number().describe('Calculated rate (0-100).'),
    label: z.string()
  }),
  evidenceStrength: EvidenceStrengthSchema,
  methodology: z.object({
    uniqueSessionCount: z.number().int(),
    totalSignalCount: z.number().int(),
    evidenceTypesIncluded: z.array(z.string()),
    aggregationVersion: z.string().default('1.1.0'),
    timeWindow: {
        start: z.string(),
        end: z.string()
    }
  }),
  generatedAt: z.string()
});

export type IntelligenceInsight = z.infer<typeof IntelligenceInsightSchema>;

export const AggregateIntelligenceInputSchema = z.object({
  idToken: z.string().optional().describe("Firebase ID token for authorization."),
  retailerId: z.string(),
  gtin: z.string().optional(),
  daysLookback: z.number().default(30)
});

export const AggregateIntelligenceOutputSchema = z.object({
  summary: z.string(),
  insights: z.array(IntelligenceInsightSchema),
  stats: z.object({
    totalUniqueSessions: z.number().int(),
    totalSignalsProcessed: z.number().int()
  })
});
