
'use server';
/**
 * @fileOverview A Genkit flow to send a remote command to a display device.
 * Hardened with server-side authorization.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

if (!admin.apps.length) {
  admin.initializeApp();
}

const RemoteDisplayCommandInputSchema = z.object({
  idToken: z.string().optional().describe("Firebase ID token for authorization."),
  displayId: z.string().describe("The unique ID of the target display device."),
  command: z.string().min(1).describe("The command to send (e.g., 'RESTART', 'REFRESH_CONTENT')."),
  retailerId: z.string().describe("The ID of the retailer initiating the command for authorization."),
});
export type RemoteDisplayCommandInput = z.infer<typeof RemoteDisplayCommandInputSchema>;

const RemoteDisplayCommandOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  commandId: z.string().optional(),
});
export type RemoteDisplayCommandOutput = z.infer<typeof RemoteDisplayCommandOutputSchema>;


export async function remoteDisplayCommand(input: RemoteDisplayCommandInput): Promise<RemoteDisplayCommandOutput> {
  return remoteDisplayCommandFlow(input);
}


const remoteDisplayCommandFlow = ai.defineFlow(
  {
    name: 'remoteDisplayCommandFlow',
    inputSchema: RemoteDisplayCommandInputSchema,
    outputSchema: RemoteDisplayCommandOutputSchema,
  },
  async ({ idToken, displayId, command, retailerId }) => {
    // AUTHORIZATION GATE
    const authorizedRetailerId = await getAuthorizedRetailerId(idToken, retailerId);
    
    const db = admin.firestore();
    const displayRef = db.collection('displays').doc(displayId);
    
    try {
      const displayDoc = await displayRef.get();

      if (!displayDoc.exists) {
        return { success: false, message: `Display with ID ${displayId} not found.` };
      }

      const displayData = displayDoc.data();

      // Security Check: Ensure the retailer ID from verified claim matches the display's owner
      if (displayData?.retailerId !== authorizedRetailerId) {
        return { success: false, message: `Access Denied: You are not authorized to command this display.` };
      }

      // Add the command to the subcollection
      const commandRef = displayRef.collection('remoteCommands').doc();
      await commandRef.set({
        command: command,
        issuedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'PENDING',
      });

      return {
        success: true,
        message: `Command '${command}' successfully sent to display ${displayId}.`,
        commandId: commandRef.id,
      };

    } catch (error: any) {
      console.error(`Failed to send command to display ${displayId}:`, error);
      return {
        success: false,
        message: `An error occurred: ${error.message}`,
      };
    }
  }
);
