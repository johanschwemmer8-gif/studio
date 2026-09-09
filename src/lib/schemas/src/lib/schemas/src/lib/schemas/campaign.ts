import { z } from 'genkit';
import { QrActivationTargetSchema } from '@/lib/schemas/bulk-qr-request';

/**
 * @fileOverview QR Campaign schemas.
 *
 * ARCHITECTURE:
 * - A Campaign is the commercial/marketing container that groups
 *   related Activations together (see bulk-qr-request.ts for Activation).
 * - A Campaign does NOT replace the Activation and does not itself
 *   produce a QR.
 *
 * CAMPAIGN MODE
 *   'single-target' — the campaign targets one specific product/brand
 *                      (e.g. one Merlot). The campaign's `target` field
 *                      is populated and can pre-fill each Activation.
 *   'collection'     — the campaign spans many different products
 *                      (e.g. "Summer 2027 Clothing"). The campaign's
 *                      `target` stays empty; each Activation defines
 *                      its own target independently.
 *
 * CAMPAIGN TYPE
 *   'promotion'  — marketing/promotional campaign, tied to supplier
 *                  funding or a promotional calendar. Tracked for
 *                  Profit & ROI (basket size / conversion proxy metrics).
 *   'engagement' — pure shopper engagement/decision-support campaign.
 *                  Tracked for consideration/comparison-style metrics.
 */

export const CampaignTypeEnum = z.enum(['promotion', 'engagement']);
export const CampaignModeEnum = z.enum(['single-target', 'collection']);
export const CampaignStatusEnum = z.enum([
  'draft',
  'active',
  'paused',
  'ended',
]);

export const CreateCampaignInputSchema = z.object({
  /**
   * Firebase ID token used for authoritative identity resolution.
   */
  idToken: z
    .string()
    .describe('Firebase ID token for authoritative identity resolution.'),

  /**
   * Intended retailer tenant. The server verifies this against the
   * authenticated identity.
   */
  retailerId: z.string().describe('The intended ID of the retailer.'),

  campaignName: z
    .string()
    .min(1, 'Campaign name is required'),

  campaignType: CampaignTypeEnum,

  campaignMode: CampaignModeEnum,

  /**
   * Required when campaignMode === 'single-target'.
   * Must remain empty/omitted when campaignMode === 'collection',
   * since a collection campaign's target lives on each Activation.
   */
  target: QrActivationTargetSchema.optional(),

  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignInputSchema>;

export const CampaignSchema = z.object({
  campaignId: z.string(),
  retailerId: z.string(),
  campaignName: z.string(),
  campaignType: CampaignTypeEnum,
  campaignMode: CampaignModeEnum,
  target: QrActivationTargetSchema.nullable(),
  status: CampaignStatusEnum,
  startDate: z.string().datetime().nullable(),
  endDate: z.string().datetime().nullable(),
  createdBy: z.string(),
});

export type Campaign = z.infer<typeof CampaignSchema>;