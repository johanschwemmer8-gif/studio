import { z } from 'zod';

export const BeginQrShopperSessionInputSchema = z.object({
  qrCodeId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
});

export type BeginQrShopperSessionInput = z.infer<
  typeof BeginQrShopperSessionInputSchema
>;
