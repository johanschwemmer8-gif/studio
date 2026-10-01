import { z } from 'zod';

/**
 * Canonical Retailer Additive AI Governance schema.
 *
 * AUTHORITY MODEL
 *
 * iNteract Platform Governance
 *        ↓ mandatory
 * Retailer Additive Governance
 *        ↓ additive restrictions only
 * Effective AI Governance
 *
 * Retailer governance MUST NOT:
 * - disable a Platform Governance control;
 * - weaken a Platform Governance control;
 * - replace a Platform Governance control;
 * - override Platform Governance authority;
 * - redefine capability authority;
 * - select or authorize AI providers/models;
 * - contain executable prompts or model instructions;
 * - be treated as Ari personality/configuration.
 *
 * Ari personality and experience configuration remains a separate
 * responsibility and is not represented by this schema.
 */

export const RetailerAiGovernanceStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
]);

export type RetailerAiGovernanceStatus = z.infer<
  typeof RetailerAiGovernanceStatusSchema
>;

export const RetailerAiGovernanceRuleTypeSchema = z.enum([
  'TRANSPARENCY_REQUIREMENT',
  'SPONSORSHIP_DISCLOSURE_REQUIREMENT',
  'COMPLAINT_RECOURSE_REQUIREMENT',
]);

export type RetailerAiGovernanceRuleType = z.infer<
  typeof RetailerAiGovernanceRuleTypeSchema
>;

export const RetailerAiGovernanceRuleSchema = z
  .object({
    ruleId: z.string().min(1),
    ruleType: RetailerAiGovernanceRuleTypeSchema,

    /**
     * Platform control under which this retailer addition is permitted.
     * Runtime validation must establish that the referenced canonical
     * Platform control exists and has retailerExtensibility ADDITIVE_ONLY.
     */
    platformControlId: z.string().min(1),

    title: z.string().min(1),
    description: z.string().min(1),

    /**
     * Structured rule value interpreted only according to ruleType.
     * This is intentionally not an arbitrary prompt or model instruction.
     */
    value: z.union([
      z.string().min(1),
      z.array(z.string().min(1)).min(1),
    ]),
  })
  .strict();

export type RetailerAiGovernanceRule = z.infer<
  typeof RetailerAiGovernanceRuleSchema
>;

export const RetailerAiGovernanceSchema = z
  .object({
    retailerId: z.string().min(1),

    governanceVersion: z.string().min(1),

    status: RetailerAiGovernanceStatusSchema,

    additiveRules: z
      .array(RetailerAiGovernanceRuleSchema)
      .default([]),

    createdAt: z.unknown(),
    createdBy: z.string().min(1),

    updatedAt: z.unknown(),
    updatedBy: z.string().min(1),
  })
  .strict();

export type RetailerAiGovernance = z.infer<
  typeof RetailerAiGovernanceSchema
>;
