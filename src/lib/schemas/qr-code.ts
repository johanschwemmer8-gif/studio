import { z } from "zod";

import {
  FirestoreTimestampSchema,
  QrCodeStatusSchema,
  QrEnvironmentSchema,
} from "./retail-domain";

/**
 * Canonical QR identity schema.
 *
 * ARCHITECTURE:
 * Retailer
 *   → Campaign
 *     → Activation
 *       → Deployment
 *         → QR
 *
 * The QR is the stable digital identity of a Deployment pathway.
 * It is NOT the product identity and does not own Activation,
 * Product Catalog, placement, shopper objective, AI configuration,
 * scan-count, session, or transaction authority.
 */
export const QrCodeSchema = z.object({
  qrCodeId: z.string().min(1),

  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
  activationId: z.string().min(1),
  deploymentId: z.string().min(1),

  environment: QrEnvironmentSchema,
  status: QrCodeStatusSchema,

  /**
   * Stable public resolver destination encoded into the QR artifact.
   *
   * Reprinting must preserve this identity and URL.
   */
  trackingUrl: z.string().url(),

  /**
   * Activation configuration version applicable when this QR identity
   * was bound to its Deployment.
   */
  configurationVersion: z.number().int().min(1),

  /**
   * Optional technical provenance from bulk/import workflows.
   * This is not business-domain authority.
   */
  requestId: z.string().min(1).optional(),

  /**
   * QR artifact metadata.
   * These fields do not define QR identity.
   */
  storagePath: z.string().min(1).optional(),
  signedUrl: z.string().url().optional(),

  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().min(1),
  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().min(1),

  retiredAt: FirestoreTimestampSchema.optional(),
  retiredBy: z.string().min(1).optional(),
});

export type QrCode = z.infer<typeof QrCodeSchema>;
