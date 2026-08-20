
'use server';
/**
 * @fileOverview Persists Ari Experience configurations to Firestore.
 * Enforces tenant isolation via trusted identity.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

if (!admin.apps.length) {
  admin.initializeApp();
}

const SaveAiConfigInputSchema = z.object({
  idToken: z.string().describe("Auth token for verification."),
  retailerId: z.string().describe("The tenant ID."),
  config: z.any().describe("The AI personality and strategy payload."),
});

const SaveAiConfigOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function saveAiConfig(input: z.infer<typeof SaveAiConfigInputSchema>) {
    return saveAiConfigFlow(input);
}

const saveAiConfigFlow = ai.defineFlow(
  {
    name: 'saveAiConfigFlow',
    inputSchema: SaveAiConfigInputSchema,
    outputSchema: SaveAiConfigOutputSchema,
  },
  async ({ idToken, retailerId, config }) => {
    const authorizedRetailerId = await getAuthorizedRetailerId(idToken, retailerId);
    const db = admin.firestore();

    try {
        await db.collection('configurations').doc(`${authorizedRetailerId}_ai`).set({
            retailerId: authorizedRetailerId,
            type: 'ai',
            data: config,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            success: true,
            message: "Ari personality updated across the network."
        };
    } catch (e: any) {
        console.error("AI Config Error:", e.message);
        throw e;
    }
  }
);
