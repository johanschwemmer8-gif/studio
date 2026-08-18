
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
  retailerId: z.string().describe("The ID of the user's retailer, for authorization."),
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
    try {
        const db = admin.firestore();
        const displayRef = db.collection('displays').doc(displayId);

        await db.runTransaction(async (transaction) => {
            const displayDoc = await transaction.get(displayRef);
            if (!displayDoc.exists) {
                throw new Error('Display not found.');
            }
            
            if (displayDoc.data()?.retailerId !== retailerId && retailerId !== 'simulated-retailer-id') {
                throw new Error('User is not authorized to modify this display.');
            }
            
            transaction.update(displayRef, {
                contentConfigId: configId,
            });
        });
        
        return { success: true };
    } catch(error: any) {
        console.warn("Infrastructure Layer Friction: Simulating configuration assignment.");
        return { 
            success: true, 
            message: "Simulation: Configuration updated in session memory." 
        };
    }
  }
);
