
import { z } from 'genkit';

/**
 * @fileOverview Controlled Taxonomy for Structured Interaction Signals.
 * Defines the evidence layer for customer-expressed information.
 */

export const EvidenceTypeSchema = z.enum(['explicit', 'derived', 'inferred']).describe(
  'Explicit: Directly stated. Derived: Deterministically calculated. Inferred: AI interpretation.'
);

export const ConfidenceLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW', 'INFERRED']).describe(
  'HIGH: Clear explicit statement. MEDIUM: Minor interpretation. LOW: Ambiguous. INFERRED: Model guess.'
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
  value: z.any().describe('The structured value of the signal (e.g. numeric budget, boolean preference, or specific feature).'),
  evidenceType: EvidenceTypeSchema,
  confidence: ConfidenceLevelSchema,
  statedReason: z.string().optional().describe('The verbatim or near-verbatim reason expressed by the customer.'),
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
    sourceMessage: z.string().describe('The user message that triggered this signal.'),
    extractionVersion: z.string().default('1.0.0')
  })
});
