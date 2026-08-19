import { z } from 'genkit';

/**
 * @fileOverview Controlled Taxonomy for Structured Interaction Signals & Shopper Context.
 * Defines the evidence layer for customer-expressed information and working session memory.
 * VERSION: 1.3.1 (PII Hardened)
 */

export const EvidenceTypeSchema = z.enum(['explicit', 'derived', 'inferred']).describe(
  'explicit: Directly stated by the shopper. derived: Deterministically calculated from system events. inferred: AI interpretation of intent (never to be treated as fact).'
);

export const ConfidenceLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW', 'INFERRED']).describe(
  'HIGH: Reserved for clear explicit evidence. MEDIUM: Supported but contextual. LOW: Ambiguous. INFERRED: AI interpretation.'
);

export const InteractionSignalSchema = z.object({
  type: z.enum([
    'customer_intent',
    'product_preference',
    'product_interest',     // Passive/general liking
    'product_consideration', // Active evaluation/suitability check
    'product_rejection',     // Explicit "no"
    'product_concern',
    'price_objection',
    'budget_signal',
    'feature_requirement',
    'product_comparison',
    'purchase_barrier',
    'recommendation_response',
    'information_request'
  ]).describe('The category of the extracted signal.'),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).describe('The structured value of the signal. PII (names, emails, etc.) MUST BE EXCLUDED.'),
  evidenceType: EvidenceTypeSchema,
  confidence: ConfidenceLevelSchema,
  statedReason: z.string().optional().describe('The verbatim reason expressed by the customer. PII MUST BE EXCLUDED.'),
  comparisonProductGtin: z.string().optional().describe('GTIN of the product being compared, if applicable.')
});

export type InteractionSignal = z.infer<typeof InteractionSignalSchema>;

/**
 * Shopper Context Schema
 * Maintains the "Working Memory" of the current shopping session.
 */
export const ShopperContextSchema = z.object({
  objective: z.string().optional().describe('The main goal of the shopping session.'),
  requirements: z.array(z.string()).describe('Explicit must-have features or constraints.'),
  preferences: z.array(z.string()).describe('Stated likes or preferred attributes.'),
  dislikes: z.array(z.string()).describe('Products or features explicitly rejected.'),
  budget: z.object({
    limit: z.number().optional(),
    currency: z.string().default('ZAR'),
    isFlexible: z.boolean().default(false)
  }).optional(),
  consideredGtins: z.array(z.string()).describe('GTINs actively evaluated (comparison/suitability check).'),
  seenGtins: z.array(z.string()).describe('GTINs presented to the user.'),
  unresolvedQuestions: z.array(z.string()).describe('Questions the shopper asked that require further follow-up.')
});

export type ShopperContext = z.infer<typeof ShopperContextSchema>;

/**
 * Recommendation Rationale Schema
 * Ensures every Ari suggestion is traceable to evidence.
 */
export const RecommendationRationaleSchema = z.object({
  recommendedGtin: z.string().optional(),
  supportingShopperRequirements: z.array(z.string()),
  supportingVerifiedFacts: z.array(z.string()),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE']),
  logic: z.string().describe('Internal trace of why this product fits the shopper context.')
});

export type RecommendationRationale = z.infer<typeof RecommendationRationaleSchema>;
