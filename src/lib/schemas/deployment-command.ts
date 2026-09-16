import { z } from 'zod';

import { DeploymentPlacementSchema } from './deployment';

export const CreateDeploymentInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  activationId: z.string().min(1),
  storeId: z.string().min(1),
  storeName: z.string().min(1),
  placement: DeploymentPlacementSchema,
});

export type CreateDeploymentInput = z.infer<
  typeof CreateDeploymentInputSchema
>;

const DeploymentLifecycleInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  deploymentId: z.string().min(1),
});

export const AssignDeploymentInputSchema =
  DeploymentLifecycleInputSchema;

export type AssignDeploymentInput = z.infer<
  typeof AssignDeploymentInputSchema
>;

export const MarkDeploymentPrintedInputSchema =
  DeploymentLifecycleInputSchema;

export type MarkDeploymentPrintedInput = z.infer<
  typeof MarkDeploymentPrintedInputSchema
>;

export const MarkDeploymentDeployedInputSchema =
  DeploymentLifecycleInputSchema;

export type MarkDeploymentDeployedInput = z.infer<
  typeof MarkDeploymentDeployedInputSchema
>;

export const ReportDeploymentProblemInputSchema =
  DeploymentLifecycleInputSchema.extend({
    problemReason: z.string().min(1),
  });

export type ReportDeploymentProblemInput = z.infer<
  typeof ReportDeploymentProblemInputSchema
>;

export const ResolveDeploymentProblemInputSchema =
  DeploymentLifecycleInputSchema;

export type ResolveDeploymentProblemInput = z.infer<
  typeof ResolveDeploymentProblemInputSchema
>;

export const RemoveDeploymentInputSchema =
  DeploymentLifecycleInputSchema;

export type RemoveDeploymentInput = z.infer<
  typeof RemoveDeploymentInputSchema
>;

/**
 * Command contract for generating the operational Deployment Pack for an
 * existing Deployment with an already-bound production QR identity.
 *
 * Campaign, Activation, QR identity, tracking URL, store/placement context,
 * and printable artifact data are deliberately not accepted from the client.
 * They are resolved and validated server-side from canonical records.
 *
 * Generating a Deployment Pack does not create or replace QR identity and
 * does not advance Deployment lifecycle state.
 */
export const GenerateDeploymentPackInputSchema =
  DeploymentLifecycleInputSchema.extend({
    templateId: z.string().min(1),
  });

export type GenerateDeploymentPackInput = z.infer<
  typeof GenerateDeploymentPackInputSchema
>;
