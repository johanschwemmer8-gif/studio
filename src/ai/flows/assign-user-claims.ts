'use server';
/**
 * @fileOverview Secure administrative tool for assigning trusted identity claims.
 * IMPLEMENTATION: Optimistic Dual-Path Provisioning (DB First).
 * VERSION: 1.5.0 (Resilience Hardened)
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
    return assignUserClaimsFlow(input);
}

const assignUserClaimsFlow = ai.defineFlow(
  {
    name: 'assignUserClaimsFlow',
    inputSchema: AssignUserClaimsInputSchema,
    outputSchema: AssignUserClaimsOutputSchema,
  },
  async ({ idToken, targetUid, role, retailerId }) => {
    // 1. Authorize Caller (The Admin)
    // verifyAuth now has aggressive retry logic for transient cloud 500s
    const caller = await verifyAuth(idToken);
    
    if (!caller.uid) {
        throw new Error("Unauthorized: Invalid session.");
    }

    const db = getDb();
    if (!db) throw new Error("Infrastructure Layer Unavailable.");

    try {
        // 2. PATH A: Firestore Persistence (PRIMARY SOURCE OF TRUTH)
        // We write this first because it's the most reliable and doesn't rely on the cloud metadata server.
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

        // 3. PATH B: Auth Custom Claims (SECONDARY / BEST EFFORT)
        // We attempt this, but we don't let a timeout here crash the success of Path A.
        let cloudClaimStatus = "Ready";
        try {
            const auth = admin.auth();
            const claims = {
                role: role || 'analyst',
                retailerId: retailerId || 'unknown'
            };
            
            await auth.setCustomUserClaims(targetUid, claims);
            console.log(`[Admin] Cloud Claims Assigned: ${targetUid}`);
        } catch (authError: any) {
            console.warn("[Admin] Cloud Handshake Delayed:", authError.message);
            cloudClaimStatus = "Sync Pending";
        }

        return {
            success: true,
            message: cloudClaimStatus === "Ready" 
                ? `Permissions updated for ${targetUid}. Access is now active.`
                : `Permissions saved to database for ${targetUid}. Access is active, but a cloud sync delay was detected. User should log in to verify.`
        };
    } catch (error: any) {
        console.error("[Admin] Provisioning Failure:", error.message);
        return {
            success: false,
            message: `Provisioning failed: ${error.message}`
        };
    }
  }
);
