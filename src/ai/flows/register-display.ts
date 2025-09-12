
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
    
    const displayId = `display_${storeId.toLowerCase().replace(/[\s\W]/g, '_')}_${Math.random().toString(36).substring(2, 7)}`;
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
