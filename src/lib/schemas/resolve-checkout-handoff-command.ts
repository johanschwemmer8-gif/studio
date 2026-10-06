import { z } from 'zod';

export const ResolveCheckoutHandoffInputSchema = z.object({
  idToken: z.string().min(1),
  checkoutHandoffId: z.string().min(1),
});

export type ResolveCheckoutHandoffInput = z.infer<
  typeof ResolveCheckoutHandoffInputSchema
>;
