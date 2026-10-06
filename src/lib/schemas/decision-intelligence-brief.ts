import { z } from 'zod';

/**
 * Governed Decision Intelligence Brief.
 *
 * Gemini may interpret authoritative evidence but may never become
 * evidence authority. Every substantive statement must cite evidence
 * admitted by the server-side evidence package.
 */

export const DecisionIntelligenceStatementSchema = z.object({
  statement: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).min(1),
});

export const DecisionIntelligenceHypothesisSchema = z.object({
  hypothesis: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).min(1),
  investigation: z.string().min(1),
});

export const DecisionIntelligenceBriefProposalSchema = z.object({
  executiveSummary: z.string().min(1),

  factualObservations: z.array(
    DecisionIntelligenceStatementSchema
  ),

  identifiedIndicators: z.array(
    DecisionIntelligenceStatementSchema
  ),

  suggestedActions: z.array(
    DecisionIntelligenceStatementSchema
  ),

  hypothesesToInvestigate: z.array(
    DecisionIntelligenceHypothesisSchema
  ),

  evidenceLimitations: z.array(z.string().min(1)),
});

export type DecisionIntelligenceBriefProposal = z.infer<
  typeof DecisionIntelligenceBriefProposalSchema
>;

export const DecisionIntelligenceBriefSchema =
  DecisionIntelligenceBriefProposalSchema.extend({
    status: z.enum([
      'AVAILABLE',
      'INSUFFICIENT_EVIDENCE',
      'AI_UNAVAILABLE',
    ]),
  });

export type DecisionIntelligenceBrief = z.infer<
  typeof DecisionIntelligenceBriefSchema
>;
