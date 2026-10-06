import { z } from 'zod';

export const PrepareCheckoutHandoffInputSchema = z.object({
  sessionId: z.string().min(1),
});

export type PrepareCheckoutHandoffInput = z.infer<
  typeof PrepareCheckoutHandoffInputSchema
>;
