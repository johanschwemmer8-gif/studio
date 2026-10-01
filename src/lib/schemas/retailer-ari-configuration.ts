import { z } from 'zod';

/**
 * Canonical Retailer Ari Configuration schema.
 *
 * SCOPE
 *
 * This contract defines retailer-wide Ari experience defaults only.
 *
 * Retailer Ari Configuration MAY control permitted presentation and
 * communication preferences.
 *
 * Retailer Ari Configuration MUST NOT:
 * - override Platform AI Governance;
 * - override Retailer Additive AI Governance;
 * - authorize or disable AI capabilities;
 * - select or authorize AI providers or models;
 * - weaken product-evidence requirements;
 * - contain executable system prompts or model instructions;
 * - define Activation-specific context;
 * - define Shopper Destination.
 *
 * Activation Persona, Activation Tone and Shopper Objective belong to
 * Activation Context and are resolved separately.
 *
 * Ari operates in English in v1. Language selection is intentionally
 * not part of the retailer-configurable v1 contract.
 */

export const AriPersonalitySchema = z.enum([
  'PROFESSIONAL_HELPFUL',
  'FRIENDLY_APPROACHABLE',
  'EXPERT_INFORMATIVE',
]);

export type AriPersonality = z.infer<typeof AriPersonalitySchema>;

export const AriToneSchema = z.enum([
  'FORMAL',
  'CONVERSATIONAL',
  'WARM',
  'CONCISE',
]);

export type AriTone = z.infer<typeof AriToneSchema>;

export const RetailerAriConfigurationSchema = z
  .object({
    retailerId: z.string().min(1),

    configurationVersion: z.string().min(1),

    assistantName: z.string().trim().min(1).max(60).default('Ari'),

    personality: AriPersonalitySchema.default('FRIENDLY_APPROACHABLE'),

    tone: AriToneSchema.default('CONVERSATIONAL'),

    /**
     * Bounded descriptive communication preference only.
     * This value is not an executable system prompt or model instruction.
     */
    brandVoice: z.string().trim().max(500).default(''),

    welcomeMessage: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .default("Hi! I'm Ari. How can I help you with this product today?"),

    /**
     * Presentation preferences only. These settings cannot create evidence.
     * Price or availability may be displayed only when authoritative evidence
     * for that information exists.
     */
    recommendationCount: z.number().int().min(1).max(6).default(3),
    includePrice: z.boolean().default(true),
    showAvailability: z.boolean().default(true),

    createdAt: z.unknown(),
    createdBy: z.string().min(1),

    updatedAt: z.unknown(),
    updatedBy: z.string().min(1),
  })
  .strict();

export type RetailerAriConfiguration = z.infer<
  typeof RetailerAriConfigurationSchema
>;
