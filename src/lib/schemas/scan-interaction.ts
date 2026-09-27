
import { z } from 'zod';

export const GetScanInteractionInputSchema = z.object({
  qrId: z.string(),
  shopperUid: z.string().optional(),
});
export type GetScanInteractionInput = z.infer<typeof GetScanInteractionInputSchema>;

export const GetScanInteractionOutputSchema = z.object({
  messages: z.array(z.string()).describe('An array of short, engaging messages from the AI assistant.'),
  destinationUrl: z.string().url().describe('The final URL the user should be redirected to.'),
  retailerLogoUrl: z.string().url().optional().describe('The URL of the retailer\'s legacy tenant logo.'),

  /**
   * Canonical shopper presentation configuration.
   *
   * Resolved from configurations/{retailerId}_brand after the QR has been
   * resolved to its authoritative retailer. This controls presentation only;
   * it does not define QR, Activation, Campaign, Deployment, Product, or
   * Shopper Session identity.
   */
  /**
   * Authoritative live shopper-entry context.
   *
   * Populated only from the resolved production QR / Activation chain.
   * These fields must never be inferred from shopper authentication,
   * presentation branding, or client state.
   */
  retailerId: z.string().trim().min(1).optional(),
  activationId: z.string().trim().min(1).optional(),
  gtin: z.string().trim().min(1).optional(),

  shopperPresentation: z.object({
    selectedTemplate: z.enum([
      'template1',
      'template2',
      'template3',
      'template4',
      'template5',
      'template6',
      'template7',
      'template8',
      'template9',
    ]),
    branding: z.object({
      logoUrl: z.string().url().or(z.literal('')).default(''),
      logoWidth: z.number().min(40).max(220),
      logoMaxHeight: z.number().min(16).max(48),
      logoAlign: z.enum(['flex-start', 'center', 'flex-end']),
      logoPadding: z.number().min(0).max(12),
      headerBackgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    }),
  }),

  // Fields for campaign media content
  mediaType: z.enum(['image', 'video']).optional(),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  headline: z.string().optional(),
  subhead: z.string().optional(),

  /**
   * Activation-specific sponsored media.
   *
   * This is shopper-experience configuration only. It does not define
   * Campaign, Deployment, QR, Product, or shopper-session identity.
   */
  sponsoredMedia: z
    .object({
      format: z.enum(['VIDEO', 'BRAND_STRIP']),
      sponsorName: z.string().trim().min(1),
      mediaUrl: z.string().url(),
      headline: z.string().trim().min(1).optional(),
      destinationUrl: z.string().url().optional(),

      /**
       * Opaque Retail Media presentation-opportunity identity.
       * Present only when canonical 15B eligibility was established.
       * This is not a Shopper Session, Partner, Creative, or QR identity.
       */
      presentationId: z.string().trim().min(1).optional(),
    })
    .optional(),
});
export type GetScanInteractionOutput = z.infer<typeof GetScanInteractionOutputSchema>;
