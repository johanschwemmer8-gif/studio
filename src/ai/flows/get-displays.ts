
'use server';
/**
 * @fileOverview A Genkit flow to retrieve registered display devices from Firestore.
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
    // In a real application, you would also verify that the calling user has permission
    // to view displays for this retailerId.
    const db = admin.firestore();
    const displaysRef = db.collection('displays');
    const snapshot = await displaysRef.where('retailerId', '==', retailerId).get();
    
    if (snapshot.empty) {
      return [];
    }

    const displays: Display[] = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        displays.push({
            displayId: data.displayId,
            retailerId: data.retailerId,
            storeId: data.storeId,
            contentConfigId: data.contentConfigId,
            status: data.status,
            // Convert Firestore Timestamp to ISO string for serialization
            lastPing: (data.lastPing as admin.firestore.Timestamp).toDate().toISOString(),
        });
    });
    
    return displays;
  }
);
