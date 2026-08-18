import { z } from 'genkit';

/**
 * @fileOverview Decision Journey Intelligence Schemas.
 * Defines the structure for deterministic shopper journey analysis.
 * VERSION: 1.4.0 (Rejection & Barrier Intelligence Hardened)
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

export const BarrierSignalSchema = z.object({
  barrier: z.string(),
  count: z.number().int(),
  share: z.number().describe('Percentage of exposed sessions containing this barrier.'),
});

export const AltProductMovementSchema = z.object({
  gtin: z.string(),
  uniqueSessions: z.number().int(),
  rate: z.number().describe('Percentage of source-product sessions.'),
  purchaseCount: z.number().int().describe('Sessions where this alternative was eventually purchased.'),
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
  barrierBreakdown: z.array(BarrierSignalSchema).describe('Factual breakdown of explicit purchase barriers (Price, Size, etc).'),
  altProductBreakdown: z.array(AltProductMovementSchema),
  stats: z.object({
    totalUniqueSessions: z.number().int(),
    alternativeProductMovements: z.number().int().describe('Sessions where the shopper engaged with another GTIN.'),
    recommendationToPurchaseCount: z.number().int().default(0).describe('Factual co-occurrence of recommendation followed by purchase.'),
    leakagePoints: z.record(z.number()).describe('Counts of where journeys ended (e.g., "VIEW_ONLY")'),
    rejectionsWithReason: z.number().int().default(0),
    rejectionsWithoutReason: z.number().int().default(0),
  }),
  metadata: z.object({
    aggregationVersion: z.string().default('1.4.0'),
    dataStatus: z.enum(['VERIFIED', 'SIMULATED']),
    evidenceStrength: z.enum(['LOW', 'MODERATE', 'HIGHER']),
    methodology: z.string()
  })
});

export type DecisionJourneyOutput = z.infer<typeof DecisionJourneyOutputSchema>;
