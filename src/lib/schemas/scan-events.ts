import { z } from 'zod';

export const GetScanEventsInputSchema = z.object({
  retailerId: z.string().optional(),
  campaignId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});
export type GetScanEventsInput = z.infer<typeof GetScanEventsInputSchema>;

const ScanEventSchema = z.object({
    eventId: z.string(),
    qrCodeId: z.string(),
    retailerId: z.string(),
    campaignId: z.string(),
    timestamp: z.string(),
    userAgent: z.string(),
    referrer: z.string(),
});

export const GetScanEventsOutputSchema = z.array(ScanEventSchema);
export type GetScanEventsOutput = z.infer<typeof GetScanEventsOutputSchema>;
