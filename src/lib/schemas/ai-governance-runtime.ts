import { z } from 'zod';

import { FirestoreTimestampSchema } from './retail-domain';

/**
 * Canonical runtime AI governance schemas.
 *
 * ARCHITECTURE:
 * The runtime governance context is resolved by trusted server-side code.
 * Client/browser input must never be authoritative for governance version,
 * effective controls, capability authorization or provider/model selection.
 *
 * These records establish governance provenance. They do not contain or
 * replace prompts, model responses, conversation transcripts or chain-of-
 * thought.
 */

export const AiExecutionOutcomeSchema = z.enum([
  'SUCCEEDED',
  'FAILED',
  'REFUSED',
]);

export type AiExecutionOutcome = z.infer<
  typeof AiExecutionOutcomeSchema
>;

/**
 * Compact server-resolved governance context for one AI capability
 * execution.
 *
 * This is intentionally not the complete governance catalogue.
 */
export const AiRuntimeGovernanceContextSchema = z.object({
  governanceId: z.string().min(1),
  governanceVersion: z.string().min(1),

  capabilityId: z.string().min(1),
  capabilityVersion: z.string().min(1),

  effectiveControlIds: z.array(z.string().min(1)).min(1),

  providerId: z.string().min(1),
  modelId: z.string().min(1),
  providerModelBindingId: z.string().min(1),

  resolvedAt: FirestoreTimestampSchema,
});

export type AiRuntimeGovernanceContext = z.infer<
  typeof AiRuntimeGovernanceContextSchema
>;

/**
 * Governance provenance for an actual AI execution.
 *
 * FIRESTORE:
 * aiExecutionGovernance/{executionId}
 *
 * Existing domain stores remain authoritative for conversations, sessions,
 * activations and other business records. This record links an execution to
 * the governance authority under which it occurred without indiscriminately
 * duplicating sensitive content.
 */
export const AiExecutionGovernanceRecordSchema = z.object({
  executionId: z.string().min(1),

  governanceId: z.string().min(1),
  governanceVersion: z.string().min(1),

  capabilityId: z.string().min(1),
  capabilityVersion: z.string().min(1),

  effectiveControlIds: z.array(z.string().min(1)).min(1),

  providerId: z.string().min(1),
  modelId: z.string().min(1),
  providerModelBindingId: z.string().min(1),

  retailerId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  activationId: z.string().min(1).optional(),
  conversationId: z.string().min(1).optional(),

  startedAt: FirestoreTimestampSchema,
  completedAt: FirestoreTimestampSchema.optional(),

  outcome: AiExecutionOutcomeSchema,
  failureCode: z.string().min(1).optional(),
});

export type AiExecutionGovernanceRecord = z.infer<
  typeof AiExecutionGovernanceRecordSchema
>;
