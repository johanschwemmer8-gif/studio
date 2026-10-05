import { z } from 'zod';

import {
  FirestoreTimestampSchema,
  QrEnvironmentSchema,
} from './retail-domain';

/**
 * Canonical anonymous shopper basket.
 *
 * A Basket belongs to one canonical Shopper Session and one retailer.
 * GTIN remains the authoritative product identity.
 *
 * Basket monetary values are shopper-facing context only.
 * The retailer POS remains authoritative for checkout pricing and payment.
 */

export const BasketStatusSchema = z.enum([
  'ACTIVE',
  'CHECKOUT_READY',
  'HANDED_OFF',
  'COMPLETED',
  'ABANDONED',
]);

export const BasketItemSchema = z.object({
  gtin: z.string().min(1),
  quantity: z.number().int().positive(),

  /**
   * Optional presentation snapshot.
   * This is not product identity authority.
   */
  productName: z.string().min(1).optional(),

  /**
   * Optional shopper-facing price context.
   * This MUST NOT be treated as authoritative POS pricing.
   */
  displayedUnitPrice: z.number().finite().nonnegative().optional(),
});

export const BasketSchema = z.object({
  basketId: z.string().min(1),
  sessionId: z.string().min(1),
  retailerId: z.string().min(1),
  environment: QrEnvironmentSchema,

  items: z.array(BasketItemSchema),

  status: BasketStatusSchema,

  createdAt: FirestoreTimestampSchema,
  updatedAt: FirestoreTimestampSchema,
});

export type Basket = z.infer<typeof BasketSchema>;
export type BasketItem = z.infer<typeof BasketItemSchema>;
export type BasketStatus = z.infer<typeof BasketStatusSchema>;
