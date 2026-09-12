import { z } from 'zod';

import {
  ActivationExperienceConfigSchema,
  ActivationProductContextSchema,
  ActivationTargetSchema,
} from './activation';

export const CreateActivationInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  target: ActivationTargetSchema,
  productContext: z.array(ActivationProductContextSchema).default([]),
  shopperObjective: z.string().min(1),
  experienceMode: z.string().min(1),
  experienceConfig: ActivationExperienceConfigSchema,
  advancedInstructions: z.string().optional(),
  approvalRequired: z.boolean(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  timezone: z.string().min(1).optional(),
});

export type CreateActivationInput = z.infer<
  typeof CreateActivationInputSchema
>;

export const UpdateActivationInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  activationId: z.string().min(1),
  campaignId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  target: ActivationTargetSchema.optional(),
  productContext: z.array(ActivationProductContextSchema).optional(),
  shopperObjective: z.string().min(1).optional(),
  experienceMode: z.string().min(1).optional(),
  experienceConfig: ActivationExperienceConfigSchema.optional(),
  advancedInstructions: z.string().optional(),
  approvalRequired: z.boolean().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  timezone: z.string().min(1).optional(),
});

export type UpdateActivationInput = z.infer<
  typeof UpdateActivationInputSchema
>;

const ActivationLifecycleInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  activationId: z.string().min(1),
});

export const SubmitActivationInputSchema =
  ActivationLifecycleInputSchema;

export type SubmitActivationInput = z.infer<
  typeof SubmitActivationInputSchema
>;

export const ApproveActivationInputSchema =
  ActivationLifecycleInputSchema;

export type ApproveActivationInput = z.infer<
  typeof ApproveActivationInputSchema
>;

export const ScheduleActivationInputSchema =
  ActivationLifecycleInputSchema.extend({
    startAt: z.string().datetime(),
    endAt: z.string().datetime().optional(),
    timezone: z.string().min(1),
  });

export type ScheduleActivationInput = z.infer<
  typeof ScheduleActivationInputSchema
>;

export const PauseActivationInputSchema =
  ActivationLifecycleInputSchema;

export type PauseActivationInput = z.infer<
  typeof PauseActivationInputSchema
>;

export const EndActivationInputSchema =
  ActivationLifecycleInputSchema;

export type EndActivationInput = z.infer<
  typeof EndActivationInputSchema
>;

export const ArchiveActivationInputSchema =
  ActivationLifecycleInputSchema;

export type ArchiveActivationInput = z.infer<
  typeof ArchiveActivationInputSchema
>;
