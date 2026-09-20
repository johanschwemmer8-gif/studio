import { z } from 'zod';

import {
  FirestoreTimestampSchema,
  QrEnvironmentSchema,
} from './retail-domain';

/**
 * Canonical authoritative commerce transaction.
 *
 * A Transaction is commerce evidence.
 * It is NOT automatically iNteract-attributed evidence.
 *
 * Evidence ladder:
 *
 * E1
 *   A valid authoritative Transaction.
 *
 * E2
 *   A valid authoritative production Transaction whose optional sessionId
 *   has been deterministically verified against a canonical production
 *   Shopper Session within the same retailer and authorized scope.
 *
 * sessionId is deliberately optional because genuine retailer transactions
 * may exist without an iNteract Shopper Session.
 *
 * Campaign, Activation, Deployment and QR identity are deliberately NOT
 * duplicated here. For attributed transactions, the canonical Shopper
 * Session remains authoritative for that identity chain.
 */

export const TransactionSourceSchema = z.enum([
  'POS',
  'POS_IMPORT',
  'ERP',
  'CHECKOUT_SYNC',
]);

/**
 * Commerce evidence uses the same canonical environment vocabulary as the
 * QR / Shopper Session identity chain.
 *
 * PRODUCTION is the only environment eligible for production commercial
 * attribution. TEST and DEMO remain valid records but cannot unlock E2.
 */
export const TransactionEnvironmentSchema = QrEnvironmentSchema;

export const TransactionDataStatusSchema = z.literal('VERIFIED');

export const TransactionItemSchema = z.object({
  gtin: z.string().min(1),
  quantity: z.number().int().positive(),

  /**
   * Optional because external POS/ERP feeds may provide transaction totals
   * without authoritative line-level monetary values.
   */
  unitPrice: z.number().finite().nonnegative().optional(),
});

export const TransactionSchema = z.object({
  transactionId: z.string().min(1),
  retailerId: z.string().min(1),

  /**
   * Monetary transaction total.
   *
   * Zero is valid commerce evidence (for example a fully discounted
   * transaction) and must not be converted into "missing data".
   */
  amount: z.number().finite().nonnegative(),

  /**
   * ISO 4217 alphabetic currency code.
   * No retailer currency is manufactured when it is absent.
   */
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/),

  timestamp: FirestoreTimestampSchema,

  /**
   * Optional deterministic attribution foreign key.
   *
   * Presence alone NEVER establishes E2 attribution. The referenced
   * Shopper Session must be resolved and verified server-side.
   */
  sessionId: z.string().min(1).optional(),

  storeId: z.string().min(1).optional(),
  basketId: z.string().min(1).optional(),

  items: z.array(TransactionItemSchema).optional(),

  source: TransactionSourceSchema,
  dataStatus: TransactionDataStatusSchema,
  environment: TransactionEnvironmentSchema,
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionItem = z.infer<typeof TransactionItemSchema>;
export type TransactionSource = z.infer<typeof TransactionSourceSchema>;
export type TransactionEnvironment = z.infer<
  typeof TransactionEnvironmentSchema
>;
