import { z } from 'zod';

import {
  FirestoreTimestampSchema,
  QrEnvironmentSchema,
} from './retail-domain';

/**
 * Canonical Checkout Handoff.
 *
 * A Checkout Handoff is a temporary server-authoritative bridge between
 * an anonymous shopper basket and a checkout receiver.
 *
 * The handoff identity is NOT:
 * - a product identity;
 * - an Activation QR identity;
 * - a Shopper Session identity;
 * - a Transaction identity.
 *
 * The Checkout QR exposes only the opaque checkoutHandoffId required to
 * resolve this authoritative server-side record. Basket contents are never
 * encoded into the QR itself.
 */

export const CheckoutHandoffStatusSchema = z.enum([
  'READY',
  'RESOLVED',
  'CONSUMED',
  'EXPIRED',
  'CANCELLED',
]);

export const CheckoutHandoffSchema = z.object({
  checkoutHandoffId: z.string().min(1),
  basketId: z.string().min(1),
  sessionId: z.string().min(1),
  retailerId: z.string().min(1),
  environment: QrEnvironmentSchema,

  status: CheckoutHandoffStatusSchema,

  createdAt: FirestoreTimestampSchema,
  expiresAt: FirestoreTimestampSchema,

  resolvedAt: FirestoreTimestampSchema.optional(),
  consumedAt: FirestoreTimestampSchema.optional(),
  cancelledAt: FirestoreTimestampSchema.optional(),
});

export type CheckoutHandoff = z.infer<typeof CheckoutHandoffSchema>;
export type CheckoutHandoffStatus = z.infer<
  typeof CheckoutHandoffStatusSchema
>;
