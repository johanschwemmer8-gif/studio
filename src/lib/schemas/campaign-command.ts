import { z } from 'zod';

export const CreateCampaignInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  purpose: z.string().optional(),
  objective: z.string().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  timezone: z.string().min(1).optional(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignInputSchema>;

export const UpdateCampaignInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  purpose: z.string().optional(),
  objective: z.string().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  timezone: z.string().min(1).optional(),
});

export type UpdateCampaignInput = z.infer<typeof UpdateCampaignInputSchema>;

export const ArchiveCampaignInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
});

export type ArchiveCampaignInput = z.infer<typeof ArchiveCampaignInputSchema>;

export const ScheduleCampaignInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  timezone: z.string().min(1).optional(),
});

export type ScheduleCampaignInput = z.infer<
  typeof ScheduleCampaignInputSchema
>;

export const ActivateCampaignInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
});

export type ActivateCampaignInput = z.infer<
  typeof ActivateCampaignInputSchema
>;

export const PauseCampaignInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
});

export type PauseCampaignInput = z.infer<
  typeof PauseCampaignInputSchema
>;

export const ResumeCampaignInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
});

export type ResumeCampaignInput = z.infer<
  typeof ResumeCampaignInputSchema
>;

export const EndCampaignInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
});

export type EndCampaignInput = z.infer<
  typeof EndCampaignInputSchema
>;
