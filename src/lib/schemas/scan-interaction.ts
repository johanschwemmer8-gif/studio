
import { z } from 'zod';

export const GetScanInteractionInputSchema = z.object({
  qrId: z.string(),
  shopperUid: z.string().optional(),
});
export type GetScanInteractionInput = z.infer<typeof GetScanInteractionInputSchema>;

export const GetScanInteractionOutputSchema = z.object({
  messages: z.array(z.string()).describe('An array of short, engaging messages from the AI assistant.'),
  destinationUrl: z.string().url().describe('The final URL the user should be redirected to.'),
  retailerLogoUrl: z.string().url().optional().describe('The URL of the retailer\'s logo.'),
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
