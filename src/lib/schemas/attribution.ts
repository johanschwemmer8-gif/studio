
import { z } from 'genkit';

/**
 * @fileOverview Transactional Attribution Schemas.
 * Defines the structure for factual journey-to-purchase relationships.
 * VERSION: 1.0.0 (Factual Integrity)
 */

export const AttributionLevelSchema = z.enum([
  'NONE',
  'CONVERSATION',
  'PRODUCT_GUIDANCE',
  'RECOMMENDATION',
  'RECOMMENDATION_ACCEPTED',
  'RECOMMENDATION_TO_BASKET',
  'RECOMMENDATION_TO_PURCHASE'
]).describe('The observed depth of the shopper journey relative to Ari interaction.');

export const AttributionRecordSchema = z.object({
  attributionId: z.string(),
  retailerId: z.string(),
  sessionId: z.string(),
  transactionId: z.string().optional(),
  purchasedGtin: z.string().optional(),
  transactionTimestamp: z.string().optional(),
  ariInteraction: z.boolean(),
  attributionLevel: AttributionLevelSchema,
  journeyNodes: z.array(z.object({
    type: z.string(),
    timestamp: z.string(),
    gtin: z.string().optional()
  })),
  dataStatus: z.enum(['VERIFIED', 'SIMULATED']),
  attributionVersion: z.string().default('1.0.0'),
  generatedAt: z.string()
});

export type AttributionRecord = z.infer<typeof AttributionRecordSchema>;

export const AttributionReportSchema = z.object({
  retailerId: z.string(),
  totalSessions: z.number(),
  ariAssistedSessions: z.number(),
  ariAssistedPurchases: z.number(),
  records: z.array(AttributionRecordSchema),
  dataStatus: z.enum(['VERIFIED', 'SIMULATED'])
});

export type AttributionReport = z.infer<typeof AttributionReportSchema>;
