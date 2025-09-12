
'use server';
/**
 * @fileOverview A Genkit flow to register a new display device.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const RegisterDisplayInputSchema = z.object({
  retailerId: z.string(),
  storeId: z.string(),
});

const RegisterDisplayOutputSchema = z.object({
    success: z.boolean(),
    displayId: z.string(),
    message: z.string().optional(),
});

export const registerDisplay = ai.defineFlow(
  {
    name: 'registerDisplay',
    inputSchema: RegisterDisplayInputSchema,
    outputSchema: RegisterDisplayOutputSchema,
  },
  async ({ retailerId, storeId }) => {
    const db = admin.firestore();
    
    // In a real scenario, you'd verify the caller's retailerId from their auth token
    // against the retailerId provided in the payload.
    
    // Sanitize the storeId to make it a valid path segment in Firestore
    const sanitizedStoreId = storeId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const displayId = `display_${sanitizedStoreId}_${Math.random().toString(36).substring(2, 7)}`;
    const displayRef = db.collection('displays').doc(displayId);

    try {
        await displayRef.set({
            displayId,
            retailerId,
            storeId,
            contentConfigId: '',
            status: 'offline',
            lastPing: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        return { success: true, displayId };
    } catch(error: any) {
        console.error("Error registering display: ", error);
        return { success: false, displayId: '', message: error.message };
    }
  }
);
