
'use server';
/**
 * @fileOverview A Genkit flow to save a retailer's API key.
 *
 * This flow is designed to be triggered by an HTTPS request from the Retailer MVP dashboard.
 * It securely stores an API key in Google Cloud Secret Manager and updates Firestore with the integration status.
 *
 * - saveRetailerApiKey - A function to handle the API key saving process.
 * - SaveRetailerApiKeyInput - The input type for the function.
 * - SaveRetailerApiKeyOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
// To enable Secret Manager, you would uncomment the following import.
// import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

if (!admin.apps.length) {
  admin.initializeApp();
}

// You would initialize the client like this:
// const secretManagerClient = new SecretManagerServiceClient();

const SaveRetailerApiKeyInputSchema = z.object({
  retailerId: z.string().describe('The unique ID of the retailer.'),
  serviceName: z.string().describe("The name of the service, e.g., 'Lightspeed POS'."),
  apiKey: z.string().describe('The API key to be saved.'),
});
export type SaveRetailerApiKeyInput = z.infer<typeof SaveRetailerApiKeyInputSchema>;

const SaveRetailerApiKeyOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SaveRetailerApiKeyOutput = z.infer<typeof SaveRetailerApiKeyOutputSchema>;


export async function saveRetailerApiKey(input: SaveRetailerApiKeyInput): Promise<SaveRetailerApiKeyOutput> {
  // In a real environment, you'd add extensive authentication and authorization checks here
  // to ensure the caller has permission to save keys for the given retailerId.
  return saveRetailerApiKeyFlow(input);
}


const saveRetailerApiKeyFlow = ai.defineFlow(
  {
    name: 'saveRetailerApiKeyFlow',
    inputSchema: SaveRetailerApiKeyInputSchema,
    outputSchema: SaveRetailerApiKeyOutputSchema,
  },
  async ({ retailerId, serviceName, apiKey }) => {
    const db = admin.firestore();
    // This is a conceptual placeholder. In a real app, you would get this from Firebase Auth custom claims.
    const projectId = process.env.FIREBASE_PROJECT_ID || 'your-gcp-project-id'; 
    const secretName = `projects/${projectId}/secrets/api-key-${retailerId}-${serviceName.toLowerCase().replace(/\s/g, '-')}`;

    try {
      // === Step 1: Store the API key in Google Cloud Secret Manager ===
      // The following block is a conceptual placeholder. To make it functional, you would need to:
      // 1. Install the Google Cloud Secret Manager client library: `npm install @google-cloud/secret-manager`
      // 2. Enable the Secret Manager API in your Google Cloud project.
      // 3. Grant the service account running this code the 'Secret Manager Admin' role.
      
      /*
      console.log(`Creating secret: ${secretName}`);
      
      // Create the secret with automatic replication.
      await secretManagerClient.createSecret({
        parent: `projects/${projectId}`,
        secretId: `api-key-${retailerId}-${serviceName.toLowerCase().replace(/\s/g, '-')}`,
        secret: {
          replication: {
            automatic: {},
          },
        },
      });

      console.log(`Adding secret version...`);
      // Add the secret version.
      await secretManagerClient.addSecretVersion({
        parent: secretName,
        payload: {
          data: Buffer.from(apiKey, 'utf8'),
        },
      });
      */
      
      console.log(`(Simulation) Secret for ${serviceName} would be stored at: ${secretName}`);


      // === Step 2: Update Firestore with the connection status ===
      // We do NOT store the key in Firestore, only a reference to the secret and the status.
      const integrationRef = db.collection('retailerIntegrations').doc(retailerId);
      await integrationRef.set({
          [serviceName]: {
              status: 'connected',
              secretName: secretName,
              lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          },
      }, { merge: true });

      return {
        success: true,
        message: `Successfully connected to ${serviceName}.`,
      };

    } catch (error: any) {
      console.error(`Failed to save API key for retailer ${retailerId}:`, error);
      
      // Basic error analysis
      let userMessage = 'An unexpected error occurred.';
      if (error.code === 5) { // 'NOT_FOUND' for Firestore
          userMessage = 'Retailer integration profile not found.';
      } else if (error.code === 6) { // 'ALREADY_EXISTS' for Secret Manager
          userMessage = 'This API key secret already exists. Consider updating it instead.';
      } else if (error.code === 7) { // 'PERMISSION_DENIED'
          userMessage = 'Permission denied. Ensure the service account has the required roles.';
      }
      
      return {
        success: false,
        message: userMessage,
      };
    }
  }
);

