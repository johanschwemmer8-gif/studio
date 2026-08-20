'use server';
/**
 * @fileOverview Secure administrative tool for assigning trusted identity claims.
 * Role: Admin Only.
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
    // 1. Authorize Caller (Must be iNteract Admin)
    const caller = await verifyAuth(idToken);
    if (caller.role !== 'admin') {
        throw new Error("Unauthorized: Only platform administrators can assign claims.");
    }

    try {
        const auth = admin.auth();
        
        // 2. Set Custom Claims
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
        return {
            success: false,
            message: `Failed to update permissions: ${error.message}`
        };
    }
  }
);
