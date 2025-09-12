
'use server';
/**
 * @fileOverview A Genkit flow to assign a content configuration to a display.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const AssignDisplayConfigInputSchema = z.object({
  displayId: z.string(),
  configId: z.string(),
  retailerId: z.string(),
});

const AssignDisplayConfigOutputSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
});

export const assignDisplayConfig = ai.defineFlow(
  {
    name: 'assignDisplayConfig',
    inputSchema: AssignDisplayConfigInputSchema,
    outputSchema: AssignDisplayConfigOutputSchema,
  },
  async ({ displayId, configId, retailerId }) => {
    const db = admin.firestore();
    const displayRef = db.collection('displays').doc(displayId);

    try {
        const displayDoc = await displayRef.get();
        if (!displayDoc.exists) {
            throw new Error('Display not found.');
        }

        // Authorization check
        if (displayDoc.data()?.retailerId !== retailerId) {
            throw new Error('User is not authorized to modify this display.');
        }
        
        await displayRef.update({
            contentConfigId: configId,
        });
        
        return { success: true };
    } catch(error: any) {
        console.error("Error assigning config to display: ", error);
        return { success: false, message: error.message };
    }
  }
);
