'use server';
/**
 * create-user.ts
 * Secure server-side user provisioning flow.
 * - Only platform admins may call
 * - Creates Firebase Auth account via Admin SDK
 * - Assigns custom claims
 * - Persists authoritative users/{uid} record
 * - Returns only safe information
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, getDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-server';

const CreateUserInputSchema = z.object({
  idToken: z.string().describe("Administrator's Firebase ID token."),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['retailerAdmin', 'storeManager', 'analyst']),
  retailerId: z.string().min(1),
});

const CreateUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  uid: z.string().optional(),
  email: z.string().optional(),
  role: z.string().optional(),
  retailerId: z.string().optional(),
  displayName: z.string().optional(),
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
  async ({ idToken, name, email, password, role, retailerId }) => {
    // 1. Authorize caller
    const caller = await verifyAuth(idToken);
    if (caller.error) {
      return { success: false, message: caller.error };
    }

    if (caller.role !== 'admin') {
      return { success: false, message: 'Unauthorized: Only platform administrators can create user accounts.' };
    }

    const db = getDb();
    if (!db) return { success: false, message: 'Infrastructure Unavailable: Firestore.' };

    // 2. Validate retailer exists
    try {
      const tenantDoc = await db.collection('tenants').doc(retailerId).get();
      if (!tenantDoc.exists) {
        return { success: false, message: `Retailer '${retailerId}' not found.` };
      }
    } catch (e: any) {
      console.error('[CreateUser] Failed to validate retailer:', e.message);
      return { success: false, message: 'Failed to validate retailer. Try again.' };
    }

    // 3. Create Auth account
    let createdUid: string | null = null;
    try {
      const auth = admin.auth();
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: false,
      });
      createdUid = userRecord.uid;

      // 4. Persist authoritative record to Firestore first (so verifyAuth fallback works)
      await db.collection('users').doc(createdUid).set({
        uid: createdUid,
        displayName: name,
        email,
        role,
        retailerId,
        isActive: true,
        provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
        provisionedBy: caller.uid,
        dataStatus: 'VERIFIED'
      });

      // 5. Assign custom claims (best-effort with timeout)
      try {
        const claims = { role: role || 'analyst', retailerId: retailerId || 'unknown' } as any;
        await Promise.race([
          auth.setCustomUserClaims(createdUid, claims),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud timeout')), 6000))
        ]);
      } catch (claimError: any) {
        console.warn('[CreateUser] Claim assignment deferred:', claimError.message);
        // Claims may be applied later; we do not roll back solely because of claim sync problems
      }

      return {
        success: true,
        message: 'User created successfully.',
        uid: createdUid,
        email,
        role,
        retailerId,
        displayName: name,
      };
    } catch (error: any) {
      console.error('[CreateUser] Failure:', error.code || error.message);

      // Duplicate email handling
      if (error.code === 'auth/email-already-exists') {
        return {
          success: false,
          message: 'This email already has a Firebase Authentication account. Use Discover Auth Accounts to provision the existing account instead.'
        };
      }

      // If we partially created an Auth user and then failed to persist, attempt compensating delete
      if (createdUid) {
        try {
          await admin.auth().deleteUser(createdUid);
          console.warn(`[CreateUser] Compensating delete executed for ${createdUid}`);
        } catch (delErr: any) {
          console.error('[CreateUser] Failed to delete orphaned auth user:', delErr.message);
        }
      }

      return { success: false, message: 'Failed to create user. Try again later.' };
    }
  }
);
