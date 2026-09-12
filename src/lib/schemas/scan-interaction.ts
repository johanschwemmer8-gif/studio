import { z } from 'zod';

import {
  ActivationProductContextSchema,
  ActivationTargetSchema,
} from './activation';
import { QrEnvironmentSchema } from './retail-domain';

/**
 * Canonical resolved shopper-experience contract.
 *
 * The client supplies only QR identity.
 * Retailer, Campaign, Activation, Deployment and configuration context
 * are resolved authoritatively by the backend.
 */
export const GetScanInteractionInputSchema = z.object({
  qrCodeId: z.string().min(1),
});

export type GetScanInteractionInput = z.infer<
  typeof GetScanInteractionInputSchema
>;

export const GetScanInteractionOutputSchema = z.object({
  messages: z
    .array(z.string())
    .describe('Short shopper-facing messages from Ari.'),

  qrCodeId: z.string().min(1),
  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
  activationId: z.string().min(1),
  deploymentId: z.string().min(1),
  configurationVersion: z.number().int().positive(),
  environment: QrEnvironmentSchema,

  retailerName: z.string().min(1),
  campaignName: z.string().min(1),
  activationName: z.string().min(1),
  shopperObjective: z.string().min(1),
  experienceMode: z.string().min(1),

  scanDestination: z.enum(['AI', 'URL']),
  destinationUrl: z.string().url().optional(),

  target: ActivationTargetSchema,
  productContext: z.array(ActivationProductContextSchema),

  retailerLogoUrl: z.string().url().optional(),
  mediaType: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  headline: z.string().optional(),
  subhead: z.string().optional(),
});

export type GetScanInteractionOutput = z.infer<
  typeof GetScanInteractionOutputSchema
>;
