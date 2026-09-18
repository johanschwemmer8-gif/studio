import { z } from 'zod';

import {
  FirestoreTimestampSchema,
  QrEnvironmentSchema,
} from './retail-domain';

/**
 * Canonical anonymous Sponsored Media measurement event.
 *
 * ARCHITECTURE:
 * - Sponsored Media measurement is separate from QR exposure, Shopper Session,
 *   Ari engagement, Decision Behaviour, and Transaction measurement.
 * - An event belongs to the canonical retailer-owned QR pathway and to one
 *   retailer-specific Retail Media Partner and Sponsored Creative.
 * - presentationId identifies one sponsored-media presentation opportunity.
 * - presentationId is not a Shopper Session identity.
 * - No shopper identity, POS value, revenue, turnover, margin, conversion, or
 *   ROI belongs in this event contract.
 *
 * Identity path:
 * Retailer -> Campaign -> Activation -> Deployment -> QR
 *          -> Partner -> Creative -> Sponsored Media Event
 */
export const SponsoredMediaEventTypeSchema = z.enum([
  'ELIGIBLE',
  'IMPRESSION',
  'STARTED',
  'COMPLETED',
  'DISMISSED',
  'REPLAYED',
  'CLICKED',
]);

export type SponsoredMediaEventType = z.infer<
  typeof SponsoredMediaEventTypeSchema
>;

export const SponsoredMediaEventSchema = z.object({
  eventId: z.string().trim().min(1),
  presentationId: z.string().trim().min(1),

  eventType: SponsoredMediaEventTypeSchema,

  retailerId: z.string().trim().min(1),
  campaignId: z.string().trim().min(1),
  activationId: z.string().trim().min(1),
  deploymentId: z.string().trim().min(1),
  qrCodeId: z.string().trim().min(1),

  partnerId: z.string().trim().min(1),
  creativeId: z.string().trim().min(1),

  format: z.enum([
    'VIDEO',
    'BRAND_STRIP',
  ]),

  configurationVersion: z.number().int().positive(),
  environment: QrEnvironmentSchema,

  playbackOrdinal: z.number().int().positive().optional(),

  timestamp: FirestoreTimestampSchema,
});

export type SponsoredMediaEvent = z.infer<
  typeof SponsoredMediaEventSchema
>;
