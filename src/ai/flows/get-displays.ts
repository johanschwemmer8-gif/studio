
'use server';
/**
 * @fileOverview A Genkit flow to retrieve registered display devices.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

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
    lastPing: z.string(),
});
export type Display = z.infer<typeof DisplaySchema>;

export const getDisplays = ai.defineFlow(
  {
    name: 'getDisplays',
    inputSchema: GetDisplaysInputSchema,
    outputSchema: z.array(DisplaySchema),
  },
  async ({ retailerId }) => {
    const db = admin.firestore();
    const displaysRef = db.collection('displays');
    const snapshot = await displaysRef.where('retailerId', '==', retailerId).get();
    
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure lastPing is converted to an ISO string for serialization.
      const lastPing = data.lastPing?.toDate ? data.lastPing.toDate().toISOString() : new Date().toISOString();
      return { ...data, displayId: doc.id, lastPing } as Display;
    });
  }
);
