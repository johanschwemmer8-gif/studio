import { z } from 'genkit';

/**
 * @fileOverview Decision Journey Intelligence Schemas.
 * Defines the structure for deterministic shopper journey analysis.
 * VERSION: 1.2.0 (Product Profile Hardened)
 */

export const JourneyStageSchema = z.object({
  stage: z.enum(['EXPOSURE', 'INTEREST', 'CONSIDERATION', 'REJECTION', 'BASKET', 'PURCHASE']),
  uniqueSessions: z.number().int(),
  numerator: z.number().int().describe('The number of sessions that reached this stage.'),
  denominator: z.number().int().describe('The total population for this metric.'),
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
  gtin: z.string().optional().describe('The target product identifier, if this is a product-specific profile.'),
  timeWindow: z.object({
    start: z.string(),
    end: z.string()
  }),
  summary: z.string().describe('Factual executive summary grounded in metrics.'),
  funnel: z.array(JourneyStageSchema),
  rejectionBreakdown: z.array(RejectionReasonSchema),
  stats: z.object({
    totalUniqueSessions: z.number().int(),
    alternativeProductMovements: z.number().int().describe('Sessions where the shopper engaged with another GTIN.'),
    recommendationToPurchaseCount: z.number().int().default(0).describe('Factual co-occurrence of recommendation followed by purchase.'),
    leakagePoints: z.record(z.number()).describe('Counts of where journeys ended (e.g., "VIEW_ONLY")'),
  }),
  metadata: z.object({
    aggregationVersion: z.string().default('1.2.0'),
    dataStatus: z.enum(['VERIFIED', 'SIMULATED']),
    evidenceStrength: z.enum(['LOW', 'MODERATE', 'HIGHER']),
    methodology: z.string()
  })
});

export type DecisionJourneyOutput = z.infer<typeof DecisionJourneyOutputSchema>;
