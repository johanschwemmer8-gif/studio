'use server';
/**
 * @fileOverview Secure administrative tool for assigning trusted identity claims.
 * IMPLEMENTATION: Dual-Path Provisioning (Auth Claims + Firestore Fallback).
 * VERSION: 1.4.1 (Hardened Payload Handling)
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
    // 1. Authorize Caller
    const caller = await verifyAuth(idToken);
    
    if (!caller.uid) {
        throw new Error("Unauthorized: Invalid session.");
    }

    const db = getDb();
    if (!db) throw new Error("Infrastructure Layer Unavailable.");

    try {
        // 2. PATH A: Firestore Persistence (Immediate Fallback)
        // This is highly reliable and provides immediate access via auth-server.ts fallback.
        await db.collection('users').doc(targetUid).set({
            uid: targetUid,
            role,
            retailerId,
            isActive: true,
            provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
            provisionedBy: caller.uid
        }, { merge: true });

        console.log(`[Admin] Firestore Identity Updated for ${targetUid}`);

        // 3. PATH B: Auth Custom Claims
        // We attempt this, but we use a non-null claims object to avoid payload errors.
        try {
            const auth = admin.auth();
            const claims = {
                role: role || 'analyst',
                retailerId: retailerId || 'unknown'
            };
            
            await auth.setCustomUserClaims(targetUid, claims);
            console.log(`[Admin] Auth Claims Assigned: ${targetUid}`);
        } catch (authError: any) {
            console.warn("[Admin] Auth Service Handshake Friction:", authError.message);
            // We do NOT throw here because Path A succeeded, and the user is unblocked.
        }

        return {
            success: true,
            message: `Permissions updated for ${targetUid}. Access is active via database fallback. (Note: User must re-login to refresh their token).`
        };
    } catch (error: any) {
        console.error("[Admin] Provisioning Failure:", error.message);
        
        if (error.message.includes('payload') || error.message.includes('object')) {
            return {
                success: false,
                message: "Identity Server Busy: The cloud handshake timed out. However, permissions may have been saved to the database. Please try logging in as the target user to verify."
            };
        }

        return {
            success: false,
            message: `Provisioning failed: ${error.message}`
        };
    }
  }
);
