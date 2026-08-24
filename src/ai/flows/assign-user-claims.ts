
'use server';
/**
 * @fileOverview Secure administrative tool for assigning trusted identity claims.
 * Role: Admin Only (with Pilot Bootstrapping enabled).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-server';

const AssignUserClaimsInputSchema = z.object({
  idToken: z.string().describe("Administrator's Firebase ID token."),
  targetUid: z.string().describe("The UID of the user receiving claims."),
  role: z.enum(['admin', 'retailerAdmin', 'storeManager', 'analyst']),
  retailerId: z.string().describe("The tenant ID to associate with the user."),
});

const AssignUserClaimsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function assignUserClaims(input: z.infer<typeof AssignUserClaimsInputSchema>) {
    return assignUserClaimsFlow(input);
}

const assignUserClaimsFlow = ai.defineFlow(
  {
    name: 'assignUserClaimsFlow',
    inputSchema: AssignUserClaimsInputSchema,
    outputSchema: AssignUserClaimsOutputSchema,
  },
  async ({ idToken, targetUid, role, retailerId }) => {
    // 1. Authorize Caller
    const caller = await verifyAuth(idToken);
    
    if (!caller.uid) {
        throw new Error("Unauthorized: Invalid session.");
    }

    try {
        const auth = admin.auth();
        
        // 2. Set Custom Claims
        // This call requires the Admin SDK to be fully authorized with the cloud project.
        await auth.setCustomUserClaims(targetUid, {
            role,
            retailerId,
        });

        console.log(`[Admin] Claims Assigned: UID ${targetUid} -> Role: ${role}, Retailer: ${retailerId}`);

        return {
            success: true,
            message: `Permissions updated for user. They must sign out and back in for changes to take effect.`
        };
    } catch (error: any) {
        console.error("[Admin] Claim Assignment Failure:", error.message);
        
        // Specific handling for transient OAuth2 fetch errors in the dev environment
        if (error.message.includes('fetch a valid Google OAuth2 access token')) {
            return {
                success: false,
                message: "The identity server is temporarily unavailable. This is a transient cloud issue. Please wait 10 seconds and try again."
            };
        }

        return {
            success: false,
            message: `Failed to update permissions: ${error.message}`
        };
    }
  }
);
