import { z } from 'zod';

import {
  FirestoreTimestampSchema,
  QrEnvironmentSchema,
} from './retail-domain';

/**
 * Canonical anonymous Shopper Session.
 *
 * A QR scan does NOT create a Shopper Session.
 * A Session begins only when a shopper performs a qualifying interaction.
 *
 * Identity path:
 * Retailer
 *   -> Campaign
 *     -> Activation
 *       -> Deployment
 *         -> QR
 *           -> Shopper Session
 *
 * Consent is deliberately not Session identity or Session authority.
 */
export const ShopperSessionSchema = z.object({
  sessionId: z.string().min(1),

  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
  activationId: z.string().min(1),
  deploymentId: z.string().min(1),
  qrCodeId: z.string().min(1),

  configurationVersion: z.number().int().positive(),
  environment: QrEnvironmentSchema,

  startedAt: FirestoreTimestampSchema,
  lastInteractionAt: FirestoreTimestampSchema,

  shopperId: z.string().min(1).optional(),

  /**
   * Optional product context only.
   *
   * GTIN is not Session identity and must only be present when the
   * qualifying interaction has one genuinely unambiguous product context.
   */
  entryGtin: z.string().min(1).optional(),
});

export type ShopperSession = z.infer<typeof ShopperSessionSchema>;
