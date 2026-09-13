'use server';
/**
 * create-user.ts
 * Secure server-side user provisioning flow.
 * - Only platform admins may call
 * - BOOTSTRAP: Allows founder email to self-provision if no admins exist.
 * - Creates Firebase Auth account via Admin SDK
 * - Assigns custom claims
 * - Persists authoritative users/{uid} record
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, getDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-server';

const FOUNDER_EMAIL = 'johan@interactaoe.co.za';

const CreateUserInputSchema = z.object({
  idToken: z.string().optional().describe("Administrator's Firebase ID token (optional for bootstrap)."),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'retailerAdmin', 'storeManager', 'analyst']),
  retailerId: z.string().min(1),
  isBootstrap: z.boolean().optional(),
});

const CreateUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  uid: z.string().optional(),
});

export async function createUser(input: z.infer<typeof CreateUserInputSchema>) {
  return createUserFlow(input);
}

const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async ({ idToken, name, email, password, role, retailerId, isBootstrap }) => {
    const db = getDb();
    if (!db) return { success: false, message: 'Infrastructure Unavailable.' };

    let isAuthorized = false;
    let actorUid = 'system';

    // 1. Check for Bootstrap Path
    if (isBootstrap && email.toLowerCase() === FOUNDER_EMAIL) {
        const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
        if (adminsSnapshot.empty) {
            console.log(`[Auth] Executing Founder Bootstrap for ${email}`);
            isAuthorized = true;
        } else {
            return { success: false, message: 'Bootstrap unavailable: Platform already has active administrators.' };
        }
    } else {
        // Standard Path: Verify Admin Caller
        const caller = await verifyAuth(idToken);
        if (caller.error) return { success: false, message: caller.error };
        if (caller.role !== 'admin') return { success: false, message: 'Unauthorized.' };
        isAuthorized = true;
        actorUid = caller.uid;
    }

    if (!isAuthorized) return { success: false, message: 'Authorization denied.' };

    // 2. Create Auth account
    let createdUid: string | null = null;
    try {
      const auth = admin.auth();
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });
      createdUid = userRecord.uid;

      // 3. Persist authoritative record
      await db.collection('users').doc(createdUid).set({
        uid: createdUid,
        name,
        email: email.toLowerCase(),
        role,
        retailerId,
        isActive: true,
        provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
        provisionedBy: actorUid,
        dataStatus: 'VERIFIED'
      });

      // 4. Assign custom claims
      const claims = { role, retailerId };
      await auth.setCustomUserClaims(createdUid, claims);

      return {
        success: true,
        message: 'Identity provisioned successfully.',
        uid: createdUid,
      };
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        return { success: false, message: 'Account already exists in Firebase Auth.' };
      }
      return { success: false, message: `Provisioning Failure: ${error.message}` };
    }
  }
);
