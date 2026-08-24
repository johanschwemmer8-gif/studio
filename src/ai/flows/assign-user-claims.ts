'use server';
/**
 * @fileOverview Secure administrative tool for assigning trusted identity claims.
 * DESIGN: Ultra-Resilient "No-Throw" Server Action.
 * VERSION: 1.6.0 (Success-First Persistence)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, getDb } from '@/lib/firebase-admin';
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
    // Top-level catch to prevent "Unexpected response from server" NextJS 15 error
    try {
        return await assignUserClaimsFlow(input);
    } catch (e: any) {
        console.error("[Server Action] Fatal Boundary Error:", e.message);
        return {
            success: false,
            message: `System Error: ${e.message || "An unexpected error occurred during provisioning."}`
        };
    }
}

const assignUserClaimsFlow = ai.defineFlow(
  {
    name: 'assignUserClaimsFlow',
    inputSchema: AssignUserClaimsInputSchema,
    outputSchema: AssignUserClaimsOutputSchema,
  },
  async ({ idToken, targetUid, role, retailerId }) => {
    // 1. Authorize Caller (The Admin)
    const caller = await verifyAuth(idToken);
    
    if (caller.error) {
        return { success: false, message: caller.error };
    }

    if (caller.role !== 'admin') {
        return { success: false, message: "Unauthorized: Only platform administrators can provision access." };
    }

    const db = getDb();
    if (!db) {
        return { success: false, message: "Infrastructure Layer Unavailable (Firestore)." };
    }

    try {
        // 2. PRIMARY PATH: Firestore Persistence
        // We write to the database first because the client-side 'verifyAuth' uses this as a fallback.
        await db.collection('users').doc(targetUid).set({
            uid: targetUid,
            role,
            retailerId,
            isActive: true,
            provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
            provisionedBy: caller.uid,
            dataStatus: 'VERIFIED'
        }, { merge: true });

        console.log(`[Admin] Database Identity Updated for ${targetUid}`);

        // 3. SECONDARY PATH: Auth Custom Claims
        // We attempt this for better performance in the long run, but we don't let cloud latency fail the action.
        let cloudClaimStatus = "Ready";
        try {
            const auth = admin.auth();
            const claims = {
                role: role || 'analyst',
                retailerId: retailerId || 'unknown'
            };
            
            // Set a timeout for the cloud handshake to avoid killing the whole action
            await Promise.race([
                auth.setCustomUserClaims(targetUid, claims),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud timeout')), 8000))
            ]);
            
            console.log(`[Admin] Cloud Claims Assigned: ${targetUid}`);
        } catch (authError: any) {
            console.warn("[Admin] Cloud Sync Deferred (Non-Fatal):", authError.message);
            cloudClaimStatus = "Sync Pending";
        }

        return {
            success: true,
            message: cloudClaimStatus === "Ready" 
                ? `Permissions updated. Access is now active.`
                : `Permissions saved to database. Access is active, but cloud sync is pending. User should re-login.`
        };
    } catch (error: any) {
        console.error("[Admin] Provisioning Failure:", error.message);
        return {
            success: false,
            message: `Persistence Failure: ${error.message}`
        };
    }
  }
);
