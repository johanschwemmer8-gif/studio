import { z } from 'zod';

export const GetScanEventsInputSchema = z.object({
  idToken: z.string().optional().describe("Firebase ID token for authorization."),
  retailerId: z.string().optional(),
  campaignId: z.string(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});
export type GetScanEventsInput = z.infer<typeof GetScanEventsInputSchema>;

/**
 * Factual event reporting schema.
 * Canonical behavioural events remain session-first. Optional fields represent
 * genuinely absent legacy data and must never be replaced with fabricated IDs.
 */
const ScanEventSchema = z.object({
    eventId: z.string(),
    sessionId: z.string().describe('Session anchor when the event is a canonical behavioural event.'),
    gtin: z.string().describe('Product dimension when genuinely known.'),
    retailerId: z.string(),
    campaignId: z.string(),
    timestamp: z.string(),
    userAgent: z.string(),
    referrer: z.string(),
});

export const GetScanEventsOutputSchema = z.array(ScanEventSchema);
export type GetScanEventsOutput = z.infer<typeof GetScanEventsOutputSchema>;
