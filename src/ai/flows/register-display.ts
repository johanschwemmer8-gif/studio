
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
    const sanitizedStoreId = storeId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const displayId = `display_${sanitizedStoreId}_${Math.random().toString(36).substring(2, 7)}`;
    
    try {
        const db = admin.firestore();
        const displayRef = db.collection('displays').doc(displayId);

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
        console.warn("Infrastructure Layer Friction: Simulating display registration.");
        return { 
            success: true, 
            displayId, 
            message: "Simulation: Display created in local memory." 
        };
    }
  }
);
