import { z } from 'zod';

import {
  FirestoreTimestampSchema,
  QrEnvironmentSchema,
} from './retail-domain';

/**
 * Canonical anonymous QR exposure.
 *
 * A successful canonical QR resolution records exposure to the Point of Decision.
 * Exposure does NOT create a Shopper Session.
 *
 * Identity path:
 * Retailer -> Campaign -> Activation -> Deployment -> QR -> Exposure
 *
 * GTIN is optional product context only and is never exposure identity.
 */
export const QrExposureSchema = z.object({
  exposureId: z.string().min(1),

  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
  activationId: z.string().min(1),
  deploymentId: z.string().min(1),
  qrCodeId: z.string().min(1),

  configurationVersion: z.number().int().positive(),
  environment: QrEnvironmentSchema,

  timestamp: FirestoreTimestampSchema,

  gtin: z.string().min(1).optional(),
});

export type QrExposure = z.infer<typeof QrExposureSchema>;
