'use server';
/**
 * Delete a retailer API integration reference.
 * Hardened with server-side authorization.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

const DeleteRetailerApiKeyInputSchema = z.object({
  idToken: z.string().optional(),
  retailerId: z.string(),
  serviceName: z.string().min(1),
});

export type DeleteRetailerApiKeyInput = z.infer<typeof DeleteRetailerApiKeyInputSchema>;

const DeleteRetailerApiKeyOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type DeleteRetailerApiKeyOutput = z.infer<typeof DeleteRetailerApiKeyOutputSchema>;

export async function deleteRetailerApiKey(input: DeleteRetailerApiKeyInput): Promise<DeleteRetailerApiKeyOutput> {
  return deleteRetailerApiKeyFlow(input);
}

const deleteRetailerApiKeyFlow = ai.defineFlow({
  name: "deleteRetailerApiKeyFlow",
  inputSchema: DeleteRetailerApiKeyInputSchema,
  outputSchema: DeleteRetailerApiKeyOutputSchema,
}, async ({ idToken, retailerId, serviceName }) => {
  const authorizedRetailerId = await getAuthorizedRetailerId(idToken, retailerId);

  try {
    const db = admin.firestore();
    const integrationRef = db.collection("retailerIntegrations").doc(authorizedRetailerId);

    await integrationRef.update({
      [serviceName]: admin.firestore.FieldValue.delete(),
    });

    return {
      success: true,
      message: `Successfully disconnected ${serviceName}.`,
    };
  } catch (error: any) {
    console.error(`Failed to delete API integration for retailer ${authorizedRetailerId}:`, error);
    return {
      success: false,
      message: "Failed to remove integration security settings.",
    };
  }
});
