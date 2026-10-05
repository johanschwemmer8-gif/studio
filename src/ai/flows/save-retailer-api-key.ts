
'use server';
/**
 * @fileOverview A Genkit flow to save a retailer's API key.
 * Hardened with server-side authorization.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

if (!admin.apps.length) {
  admin.initializeApp();
}

const SaveRetailerApiKeyInputSchema = z.object({
  idToken: z.string().optional().describe("Firebase ID token for authorization."),
  retailerId: z.string().describe('The unique ID of the retailer.'),
  serviceName: z.string().describe("The name of the service, e.g., 'Lightspeed POS'."),
  integrationType: z.enum(['pos', 'pim', 'crm']).describe('The external system category.'),
  endpoint: z.string().url('A valid HTTPS endpoint is required.'),
});
export type SaveRetailerApiKeyInput = z.infer<typeof SaveRetailerApiKeyInputSchema>;

const SaveRetailerApiKeyOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SaveRetailerApiKeyOutput = z.infer<typeof SaveRetailerApiKeyOutputSchema>;


export async function saveRetailerApiKey(input: SaveRetailerApiKeyInput): Promise<SaveRetailerApiKeyOutput> {
  return saveRetailerApiKeyFlow(input);
}


const saveRetailerApiKeyFlow = ai.defineFlow(
  {
    name: 'saveRetailerApiKeyFlow',
    inputSchema: SaveRetailerApiKeyInputSchema,
    outputSchema: SaveRetailerApiKeyOutputSchema,
  },
  async ({ idToken, retailerId, serviceName, integrationType, endpoint }) => {
    // AUTHORIZATION GATE
    const authorizedRetailerId = await getAuthorizedRetailerId(idToken, retailerId);
    
    const db = admin.firestore();

    try {
      const integrationRef = db.collection('retailerIntegrations').doc(authorizedRetailerId);
      await integrationRef.set({
          [serviceName]: {
              integrationType,
              endpoint,
              status: 'configuration_pending',
              lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          },
      }, { merge: true });

      return {
        success: true,
        message: `${serviceName} configuration saved. Production connection remains pending infrastructure provisioning.`,
      };

    } catch (error: any) {
      console.error(`Failed to save API key for retailer ${authorizedRetailerId}:`, error);
      return {
        success: false,
        message: 'Failed to process integration security settings.',
      };
    }
  }
);
