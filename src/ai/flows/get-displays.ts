
'use server';
/**
 * @fileOverview A Genkit flow to retrieve registered display devices.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp();
}

const GetDisplaysInputSchema = z.object({
  retailerId: z.string(),
});

const DisplaySchema = z.object({
    displayId: z.string(),
    retailerId: z.string(),
    storeId: z.string(),
    contentConfigId: z.string().optional(),
    status: z.enum(['online', 'offline', 'error']),
    lastPing: z.any(),
});
export type Display = z.infer<typeof DisplaySchema>;

export const getDisplays = ai.defineFlow(
  {
    name: 'getDisplays',
    inputSchema: GetDisplaysInputSchema,
    outputSchema: z.array(DisplaySchema),
  },
  async ({ retailerId }) => {
    // This flow is returning mock data to bypass local auth errors.
    // In a configured production environment, you would query Firestore.
    //
    // const db = admin.firestore();
    // const displaysRef = db.collection('displays');
    // const snapshot = await displaysRef.where('retailerId', '==', retailerId).get();
    // if (snapshot.empty) {
    //   return [];
    // }
    // return snapshot.docs.map(doc => doc.data() as Display);

    // Mock data for prototyping:
    const now = new Date();
    return [
      {
        displayId: 'display_sandton_001',
        retailerId: retailerId,
        storeId: 'Sandton City',
        contentConfigId: 'config_1716386400000',
        status: 'online',
        lastPing: Timestamp.fromDate(now),
      },
      {
        displayId: 'display_waterfront_002',
        retailerId: retailerId,
        storeId: 'V&A Waterfront',
        contentConfigId: 'config_1716386400000',
        status: 'offline',
        lastPing: Timestamp.fromDate(new Date(now.getTime() - 2 * 60 * 60 * 1000)), // 2 hours ago
      },
      {
        displayId: 'display_gateway_003',
        retailerId: retailerId,
        storeId: 'Gateway Theatre of Shopping',
        contentConfigId: '',
        status: 'error',
        lastPing: Timestamp.fromDate(new Date(now.getTime() - 24 * 60 * 60 * 1000)), // 1 day ago
      },
    ];
  }
);
