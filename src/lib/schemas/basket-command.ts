import { z } from 'zod';

/**
 * Shopper Basket command boundary.
 *
 * The caller supplies intent only.
 *
 * Retailer identity, environment, product facts, basket lifecycle and
 * presentation data are resolved and enforced server-side.
 */

export const BasketCommandSchema = z.discriminatedUnion('command', [
  z.object({
    command: z.literal('GET'),
    sessionId: z.string().min(1),
  }),

  z.object({
    command: z.literal('ADD_ITEM'),
    sessionId: z.string().min(1),
    gtin: z.string().min(1),
  }),

  z.object({
    command: z.literal('SET_QUANTITY'),
    sessionId: z.string().min(1),
    gtin: z.string().min(1),
    quantity: z.number().int().positive(),
  }),

  z.object({
    command: z.literal('REMOVE_ITEM'),
    sessionId: z.string().min(1),
    gtin: z.string().min(1),
  }),
]);

export type BasketCommand = z.infer<typeof BasketCommandSchema>;
