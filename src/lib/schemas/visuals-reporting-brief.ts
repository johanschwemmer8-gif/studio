import { z } from 'zod';

/**
 * Governed AI Reporting Brief for Visuals & Reporting.
 *
 * Gemini may interpret the exact authorised VisualsReportingResponse
 * supplied by the server, but it is never reporting evidence authority.
 *
 * Every substantive interpretation must cite evidence references admitted
 * by the deterministic server-side reporting evidence package.
 */

export const VisualsReportingBriefStatementSchema = z.object({
  statement: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).min(1),
});

export const VisualsReportingBriefProposalSchema = z.object({
  executiveSummary: z.string().min(1),

  factualObservations: z.array(
    VisualsReportingBriefStatementSchema,
  ),

  notablePatterns: z.array(
    VisualsReportingBriefStatementSchema,
  ),

  reportingLimitations: z.array(z.string().min(1)),
});

export type VisualsReportingBriefProposal = z.infer<
  typeof VisualsReportingBriefProposalSchema
>;

export const VisualsReportingBriefSchema =
  VisualsReportingBriefProposalSchema.extend({
    status: z.enum([
      'AVAILABLE',
      'INSUFFICIENT_EVIDENCE',
      'AI_UNAVAILABLE',
    ]),
  });

export type VisualsReportingBrief = z.infer<
  typeof VisualsReportingBriefSchema
>;
