import { z } from 'zod';

import { CreateActivationInputSchema } from './activation-command';
import { CreateDeploymentInputSchema } from './deployment-command';

/**
 * @fileOverview Canonical Bulk Activation orchestration schemas.
 *
 * ARCHITECTURE:
 * - One bulk work item represents one canonical Activation.
 * - Each Activation work item contains one or more Deployment intents.
 * - Bulk processing is an orchestration concern only.
 * - QR identity is NOT created or assigned by this request schema.
 * - Activation and Deployment business rules remain canonical.
 */

/**
 * Canonical Activation definition used inside one bulk work item.
 * Authentication and retailer identity are supplied once at request level.
 */
export const BulkActivationDefinitionSchema =
  CreateActivationInputSchema.omit({
    idToken: true,
    retailerId: true,
  });

export type BulkActivationDefinition = z.infer<
  typeof BulkActivationDefinitionSchema
>;

/**
 * Canonical Deployment intent belonging to the Activation created for
 * this work item. activationId is produced server-side during processing.
 */
export const BulkDeploymentIntentSchema =
  CreateDeploymentInputSchema.omit({
    idToken: true,
    retailerId: true,
    activationId: true,
  });

export type BulkDeploymentIntent = z.infer<
  typeof BulkDeploymentIntentSchema
>;

/**
 * One bulk row = one Activation plus its intended physical Deployments.
 */
export const BulkActivationWorkItemSchema = z.object({
  activation: BulkActivationDefinitionSchema,
  deployments: z
    .array(BulkDeploymentIntentSchema)
    .min(1, 'At least one Deployment is required for each bulk Activation.'),
});

export type BulkActivationWorkItem = z.infer<
  typeof BulkActivationWorkItemSchema
>;

/**
 * Technical submission envelope.
 *
 * The request does not represent an Activation, Deployment, or QR identity.
 * It exists only to authenticate, queue, process, retry, and report on
 * multiple canonical Activation work items.
 */
export const SubmitBulkQrRequestInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  items: z
    .array(BulkActivationWorkItemSchema)
    .min(1, 'At least one bulk Activation item is required.')
    .max(10000),
});

export type SubmitBulkQrRequestInput = z.infer<
  typeof SubmitBulkQrRequestInputSchema
>;
