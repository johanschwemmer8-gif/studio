
'use server';
/**
 * @fileOverview A Genkit flow to send a remote command to a display device.
 *
 * - remoteDisplayCommand - Sends a command to a display's command queue.
 * - RemoteDisplayCommandInput - The input type for the function.
 * - RemoteDisplayCommandOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const RemoteDisplayCommandInputSchema = z.object({
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
  // In a real environment, you'd add auth checks here.
  // E.g., if (!context.auth) { throw new HttpsError('unauthenticated', ...); }
  // const userRetailerId = context.auth.token.retailerId;
  const userRetailerId = 'ret_123xyz'; // Placeholder for auth context

  if (input.retailerId !== userRetailerId) {
    throw new Error('User is not authorized to send commands for this retailer.');
  }

  return remoteDisplayCommandFlow(input);
}


const remoteDisplayCommandFlow = ai.defineFlow(
  {
    name: 'remoteDisplayCommandFlow',
    inputSchema: RemoteDisplayCommandInputSchema,
    outputSchema: RemoteDisplayCommandOutputSchema,
  },
  async ({ displayId, command, retailerId }) => {
    const db = admin.firestore();
    const displayRef = db.collection('displays').doc(displayId);
    
    try {
      const displayDoc = await displayRef.get();

      if (!displayDoc.exists) {
        return { success: false, message: `Display with ID ${displayId} not found.` };
      }

      const displayData = displayDoc.data();

      // Security Check: Ensure the retailer ID matches
      if (displayData?.retailerId !== retailerId) {
        return { success: false, message: `Mismatched retailer ID. You are not authorized to command this display.` };
      }

      // Add the command to the subcollection
      const commandRef = displayRef.collection('remoteCommands').doc();
      await commandRef.set({
        command: command,
        issuedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'PENDING', // The device will update this to 'ACK' or 'FAILED'
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

