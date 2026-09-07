'use server';
/**
 * @fileOverview Secure platform user provisioning flow.
 *
 * Platform authorization is established through /platformOperators/{uid}.
 * Retailer authorization is established through the authoritative
 * /users/{uid} profile. Firebase custom claims are not authoritative.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, getDb } from '@/lib/firebase-admin';
import { verifyPlatformOperator } from '@/lib/auth-server';
import {
  AuthorizationScope,
  CanonicalRole,
  Permissions,
} from '@/lib/auth-types';
import { isRoleScopeValid } from '@/lib/authorization';
import { getDefaultPermissions } from '@/lib/user-profile';

const ScopeSchema = z.object({
  level: z.enum(['network', 'brand', 'division', 'region', 'area', 'store']),
  networkId: z.string().optional(),
  brandId: z.string().optional(),
  divisionId: z.string().optional(),
  regionId: z.string().optional(),
  areaId: z.string().optional(),
  storeId: z.string().optional(),
}).strict();

const CanonicalRoleSchema = z.enum([
  'networkOwner',
  'networkAdmin',
  'brandManager',
  'divisionManager',
  'regionalManager',
  'areaManager',
  'storeManager',
  'storeUser',
  'analyst',
]);

const CreateUserInputSchema = z.object({
  idToken: z.string().describe("Platform operator's Firebase ID token."),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: CanonicalRoleSchema,
  retailerId: z.string().min(1),
  scope: ScopeSchema,
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

export async function createUser(
  input: z.infer<typeof CreateUserInputSchema>
) {
  return createUserFlow(input);
}

const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async ({ idToken, name, email, password, role, retailerId, scope }) => {
    // 1. Authorize caller on the separate iNteract platform security plane.
    const caller = await verifyPlatformOperator(idToken);

    const db = getDb();
    if (!db) {
      return {
        success: false,
        message: 'Infrastructure Unavailable: Firestore.',
      };
    }

    // 2. Validate the target retailer.
    try {
      const tenantDoc = await db.collection('tenants').doc(retailerId).get();

      if (!tenantDoc.exists) {
        return {
          success: false,
          message: `Retailer '${retailerId}' not found.`,
        };
      }

      const tenantData = tenantDoc.data();

      if (tenantData?.status !== 'active') {
        return {
          success: false,
          message: `Retailer '${retailerId}' is not active.`,
        };
      }
    } catch (error: any) {
      console.error(
        '[CreateUser] Failed to validate retailer:',
        error?.message || error
      );

      return {
        success: false,
        message: 'Failed to validate retailer. Try again.',
      };
    }

    // 3. Validate canonical role/scope relationship.
    const authorizationScope: AuthorizationScope = scope;

    if (!isRoleScopeValid(role as CanonicalRole, authorizationScope)) {
      return {
        success: false,
        message: 'Invalid role and authorization scope combination.',
      };
    }

    if (
      authorizationScope.networkId &&
      authorizationScope.networkId !== retailerId
    ) {
      return {
        success: false,
        message: 'Authorization scope does not belong to the selected retailer.',
      };
    }

    if (
      role === 'networkOwner' ||
      role === 'networkAdmin'
    ) {
      if (authorizationScope.networkId !== retailerId) {
        return {
          success: false,
          message: 'Network roles must be scoped to the selected retailer network.',
        };
      }
    }

    // 4. Create the Firebase Authentication account.
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

      // 5. Persist the complete authoritative retailer authorization profile.
      const permissions: Permissions = getDefaultPermissions(
        role as CanonicalRole
      );

      await db.collection('users').doc(createdUid).set({
        uid: createdUid,
        displayName: name,
        email,
        role,
        retailerId,
        scope: authorizationScope,
        permissions,
        isActive: true,
        provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
        provisionedBy: caller.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: caller.uid,
        dataStatus: 'VERIFIED',
      });

      // 6. Deliberately do not assign Firebase custom claims.
      //
      // Firebase Authentication establishes identity.
      // /users/{uid} establishes authoritative retailer authorization.

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
      console.error(
        '[CreateUser] Failure:',
        error?.code || error?.message || error
      );

      if (error?.code === 'auth/email-already-exists') {
        return {
          success: false,
          message:
            'This email already has a Firebase Authentication account. Use the existing-account provisioning flow instead.',
        };
      }

      // If Auth creation succeeded but profile persistence failed,
      // attempt compensating deletion to avoid an orphaned Auth account.
      if (createdUid) {
        try {
          await admin.auth().deleteUser(createdUid);
          console.warn(
            `[CreateUser] Compensating delete executed for ${createdUid}`
          );
        } catch (deleteError: any) {
          console.error(
            '[CreateUser] Failed to delete orphaned auth user:',
            deleteError?.message || deleteError
          );
        }
      }

      return {
        success: false,
        message: 'Failed to create user. Try again later.',
      };
    }
  }
);
