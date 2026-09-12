import { z } from "zod";

import {
  FirestoreTimestampSchema,
  QrEnvironmentSchema,
} from "./retail-domain";

export const GetScanEventsInputSchema = z.object({
  idToken: z.string().optional().describe("Firebase ID token for authorization."),
  retailerId: z.string().optional(),
  campaignId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});

export type GetScanEventsInput = z.infer<typeof GetScanEventsInputSchema>;

/**
 * Canonical persisted QR scan event.
 *
 * A scan records exposure to a QR identity. It does NOT automatically create
 * or imply a Shopper Session. sessionId therefore remains optional and must
 * only be present when a real qualifying session already exists.
 *
 * Canonical identity path:
 * Retailer -> Campaign -> Activation -> Deployment -> QR -> Scan Event
 */
export const ScanEventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.literal("scan"),

  retailerId: z.string().min(1),
  campaignId: z.string().min(1),
  activationId: z.string().min(1),
  deploymentId: z.string().min(1),
  qrCodeId: z.string().min(1),

  configurationVersion: z.number().int().positive(),
  environment: QrEnvironmentSchema,

  timestamp: FirestoreTimestampSchema,

  /**
   * A scan can exist without a Shopper Session.
   */
  sessionId: z.string().min(1).optional(),

  /**
   * Compatibility/product-dimension metadata only.
   * GTIN is not QR identity and a scan may represent an Activation with
   * multiple Product Context items or a non-product Primary Target.
   */
  gtin: z.string().min(1).optional(),

  userAgent: z.string(),
  referrer: z.string(),
});

export type ScanEvent = z.infer<typeof ScanEventSchema>;

/**
 * Read DTO used by existing analytics.
 *
 * Historical events pre-date the canonical QR -> Deployment -> Activation
 * relationship, so canonical relationship fields remain optional here only.
 * New writes must validate against ScanEventSchema above.
 */
export const ScanEventReadSchema = z.object({
  eventId: z.string(),
  eventType: z.literal("scan"),

  sessionId: z.string().optional(),
  gtin: z.string().optional(),

  retailerId: z.string(),
  campaignId: z.string(),

  activationId: z.string().optional(),
  deploymentId: z.string().optional(),
  qrCodeId: z.string().optional(),
  configurationVersion: z.number().int().positive().optional(),
  environment: QrEnvironmentSchema.optional(),

  timestamp: z.string(),
  userAgent: z.string(),
  referrer: z.string(),
});

export const GetScanEventsOutputSchema = z.array(ScanEventReadSchema);
export type GetScanEventsOutput = z.infer<typeof GetScanEventsOutputSchema>;
