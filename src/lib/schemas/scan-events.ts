import { z } from 'zod';

export const GetScanEventsInputSchema = z.object({
  retailerId: z.string().optional(),
  campaignId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});
export type GetScanEventsInput = z.infer<typeof GetScanEventsInputSchema>;

/**
 * Session-First Event Schema
 * Ensures all behavioural nodes are anchored to a sessionId.
 */
const ScanEventSchema = z.object({
    eventId: z.string(),
    sessionId: z.string().describe('Mandatory session anchor for all behavioural analytics.'),
    gtin: z.string().describe('Product dimension.'),
    retailerId: z.string(),
    campaignId: z.string(),
    timestamp: z.string(),
    userAgent: z.string(),
    referrer: z.string(),
});

export const GetScanEventsOutputSchema = z.array(ScanEventSchema);
export type GetScanEventsOutput = z.infer<typeof GetScanEventsOutputSchema>;
