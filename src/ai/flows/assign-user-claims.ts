
'use server';
/**
 * @fileOverview Secure administrative tool for assigning trusted identity claims.
 * DESIGN: Ultra-Resilient "No-Throw" Server Action.
 * VERSION: 1.8.0 (Bootstrap Logic Enabled)
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

/**
 * PRIMARY SERVER ACTION
 * Only the wrapper function is exported to ensure clean RSC serialization.
 */
export async function assignUserClaims(input: z.infer<typeof AssignUserClaimsInputSchema>) {
    try {
        const result = await assignUserClaimsFlow(input);
        return {
            success: !!result?.success,
            message: result?.message || "Operation completed."
        };
    } catch (e: any) {
        console.error("[Server Action] Fatal Boundary Error:", e.message);
        return {
            success: false,
            message: `System Error: ${e.message || "An unexpected error occurred during provisioning."}`
        };
    }
}

/**
 * INTERNAL GENKIT FLOW
 */
const assignUserClaimsFlow = ai.defineFlow(
  {
    name: 'assignUserClaimsFlow',
    inputSchema: AssignUserClaimsInputSchema,
    outputSchema: AssignUserClaimsOutputSchema,
  },
  async ({ idToken, targetUid, role, retailerId }) => {
    // 1. Authorize Caller
    const caller = await verifyAuth(idToken);
    
    if (caller.error) {
        return { success: false, message: caller.error };
    }

    const db = getDb();
    if (!db) {
        return { success: false, message: "Infrastructure Layer Unavailable (Firestore)." };
    }

    try {
        // 2. BOOTSTRAP CHECK: If no users exist in the registry, allow the first user to provision themselves.
        const usersSnapshot = await db.collection('users').limit(1).get();
        const isFirstProvisioning = usersSnapshot.empty;

        if (caller.role !== 'admin' && !isFirstProvisioning) {
            return { success: false, message: "Unauthorized: Only platform administrators can provision access." };
        }

        // 3. PRIMARY PATH: Firestore Persistence
        await db.collection('users').doc(targetUid).set({
            uid: targetUid,
            role,
            retailerId,
            isActive: true,
            provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
            provisionedBy: caller.uid,
            dataStatus: 'VERIFIED'
        }, { merge: true });

        // 4. SECONDARY PATH: Auth Custom Claims
        let cloudClaimStatus = "Ready";
        try {
            const auth = admin.auth();
            const claims = {
                role: role || 'analyst',
                retailerId: retailerId || 'unknown'
            };
            
            await auth.setCustomUserClaims(targetUid, claims);
        } catch (authError: any) {
            console.warn("[Admin] Cloud Sync Deferred:", authError.message);
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
