'use server';
/**
 * @fileOverview Secure administrative tool for listing users from Firebase Auth.
 * DESIGN: Gated to Platform Admins only.
 * VERSION: 1.0.0
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-server';

const ListAuthUsersInputSchema = z.object({
  idToken: z.string().describe("Administrator's Firebase ID token."),
  maxResults: z.number().optional().default(100),
});

const AuthUserSchema = z.object({
  uid: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  role: z.string().optional(),
  retailerId: z.string().optional(),
  creationTime: z.string().optional(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

/**
 * PRIMARY SERVER ACTION
 */
export async function listAuthUsers(input: z.infer<typeof ListAuthUsersInputSchema>): Promise<AuthUser[]> {
    return listAuthUsersFlow(input);
}

/**
 * INTERNAL GENKIT FLOW
 */
const listAuthUsersFlow = ai.defineFlow(
  {
    name: 'listAuthUsersFlow',
    inputSchema: ListAuthUsersInputSchema,
    outputSchema: z.array(AuthUserSchema),
  },
  async ({ idToken, maxResults }) => {
    // 1. Authorize Caller
    const caller = await verifyAuth(idToken);
    
    if (caller.role !== 'admin') {
        throw new Error("Unauthorized: Only platform administrators can list Auth accounts.");
    }

    try {
        // 2. Fetch from Firebase Admin SDK
        const listUsersResult = await admin.auth().listUsers(maxResults);
        
        return listUsersResult.users.map(u => ({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            role: (u.customClaims?.role as string) || undefined,
            retailerId: (u.customClaims?.retailerId as string) || undefined,
            creationTime: u.metadata.creationTime,
        }));
    } catch (error: any) {
        console.error("[Admin] Auth Discovery Failure:", error.message);
        throw new Error(`Auth Service Error: ${error.message}`);
    }
  }
);
