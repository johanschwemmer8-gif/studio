
import { z } from 'genkit';

/**
 * @fileOverview Controlled Taxonomy for Structured Interaction Signals.
 * Defines the evidence layer for customer-expressed information.
 * HARDENED: Strict classification rules to prevent inference from masquerading as fact.
 */

export const EvidenceTypeSchema = z.enum(['explicit', 'derived', 'inferred']).describe(
  'explicit: Directly stated. derived: Deterministically calculated without assumptions. inferred: AI interpretation/guess.'
);

export const ConfidenceLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW', 'INFERRED']).describe(
  'HIGH: Reserved for clear explicit evidence. MEDIUM: Supported but contextual. LOW: Ambiguous. INFERRED: AI interpretation.'
);

export const InteractionSignalSchema = z.object({
  type: z.enum([
    'customer_intent',
    'product_preference',
    'product_concern',
    'price_objection',
    'budget_signal',
    'feature_requirement',
    'product_comparison',
    'purchase_barrier',
    'recommendation_response',
    'information_request'
  ]).describe('The category of the extracted signal.'),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).describe('The structured value of the signal (PII MUST BE EXCLUDED).'),
  evidenceType: EvidenceTypeSchema,
  confidence: ConfidenceLevelSchema,
  statedReason: z.string().optional().describe('The verbatim reason expressed by the customer (PII MUST BE EXCLUDED).'),
  comparisonProductGtin: z.string().optional().describe('GTIN of the product being compared, if applicable.')
});

export type InteractionSignal = z.infer<typeof InteractionSignalSchema>;

export const InteractionSignalEventSchema = z.object({
  eventId: z.string(),
  sessionId: z.string(),
  gtin: z.string().optional(),
  eventType: z.literal('interaction_signal'),
  timestamp: z.any(), // Firestore Timestamp
  metadata: InteractionSignalSchema.extend({
    sourceMessage: z.string().describe('The scrubbed user message that triggered this signal. PII MUST BE REMOVED.'),
    extractionVersion: z.string().default('1.0.0')
  })
});
