import { z } from 'genkit';

/**
 * @fileOverview Decision Journey Intelligence Schemas.
 * Defines the structure for deterministic shopper journey analysis.
 * VERSION: 1.0.0
 */

export const JourneyStageSchema = z.object({
  stage: z.enum(['EXPOSURE', 'INTEREST', 'CONSIDERATION', 'REJECTION', 'BASKET', 'PURCHASE']),
  uniqueSessions: z.number().int(),
  rate: z.number().describe('Rate relative to the appropriate denominator.'),
  denominatorName: z.string().describe('e.g., "Total Unique Exposed Sessions"'),
});

export const RejectionReasonSchema = z.object({
  reason: z.string(),
  count: z.number().int(),
  share: z.number().describe('Percentage of total explicit rejections.'),
});

export const DecisionJourneyOutputSchema = z.object({
  retailerId: z.string(),
  timeWindow: z.object({
    start: z.string(),
    end: z.string()
  }),
  summary: z.string().describe('Factual executive summary grounded in metrics.'),
  funnel: z.array(JourneyStageSchema),
  rejectionBreakdown: z.array(RejectionReasonSchema),
  stats: z.object({
    totalUniqueSessions: z.number().int(),
    alternativeProductMovements: z.number().int(),
    leakagePoints: z.record(z.number()).describe('Counts of where journeys ended (e.g., "VIEW_ONLY")'),
  }),
  metadata: z.object({
    aggregationVersion: z.string().default('1.0.0'),
    dataStatus: z.enum(['VERIFIED', 'SIMULATED']),
    evidenceStrength: z.enum(['LOW', 'MODERATE', 'HIGHER']),
    methodology: z.string()
  })
});

export type DecisionJourneyOutput = z.infer<typeof DecisionJourneyOutputSchema>;
