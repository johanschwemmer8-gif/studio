
'use server';
/**
 * @fileOverview A Genkit flow to log an A/B test conversion event.
 * This can be triggered by a Firebase Analytics event.
 *
 * - logABTestConversion - Updates an experiment's conversion count in Firestore.
 * - LogABTestConversionInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const LogABTestConversionInputSchema = z.object({
  experimentId: z.string().describe("The ID of the experiment document in Firestore."),
  variantId: z.enum(['A', 'B']).describe("The variant that the user was assigned to ('A' for control, 'B' for variant)."),
});
export type LogABTestConversionInput = z.infer<typeof LogABTestConversionInputSchema>;

export async function logABTestConversion(input: LogABTestConversionInput): Promise<{ success: boolean }> {
  // In a real Firebase environment, this would be an Analytics-triggered function.
  // We simulate it as a callable flow for now.
  // The event context would be checked here for security.
  return logABTestConversionFlow(input);
}

const logABTestConversionFlow = ai.defineFlow(
  {
    name: 'logABTestConversionFlow',
    inputSchema: LogABTestConversionInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async ({ experimentId, variantId }) => {
    const db = admin.firestore();
    const experimentRef = db.collection('experiments').doc(experimentId);

    try {
      await db.runTransaction(async (transaction) => {
        const experimentDoc = await transaction.get(experimentRef);
        if (!experimentDoc.exists) {
          throw new Error(`Experiment with ID ${experimentId} not found.`);
        }

        let updateField = '';
        if (variantId === 'A') {
          updateField = 'results.control_conversions';
        } else if (variantId === 'B') {
          updateField = 'results.variant_conversions';
        } else {
            // This case is prevented by the Zod schema, but good practice to handle.
            console.warn(`Invalid variantId: ${variantId}`);
            return;
        }

        // Atomically increment the conversion count for the specific variant.
        transaction.update(experimentRef, {
          [updateField]: admin.firestore.FieldValue.increment(1),
        });
      });
      
      console.log(`Successfully logged conversion for experiment ${experimentId}, variant ${variantId}.`);
      return { success: true };

    } catch (error: any) {
      console.error(`Failed to log conversion for experiment ${experimentId}:`, error.message);
      // It's important to re-throw the error so the flow fails and can be retried if configured.
      throw error;
    }
  }
);
