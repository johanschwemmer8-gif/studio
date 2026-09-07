'use server';

/**
 * @fileOverview Secure platform-side retailer authorization provisioning.
 *
 * Firebase Authentication establishes identity.
 * Firestore /users/{uid} establishes authoritative retailer authorization.
 *
 * Firebase custom claims are deliberately NOT used for:
 * - retailerId
 * - role
 * - scope
 * - permissions
 *
 * Platform authorization is separate and is established through
 * /platformOperators/{uid}.
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

const AuthorizationScopeSchema = z
  .object({
    level: z.enum([
      'network',
      'brand',
      'division',
      'region',
      'area',
      'store',
    ]),
    networkId: z.string().optional(),
    brandId: z.string().optional(),
    divisionId: z.string().optional(),
    regionId: z.string().optional(),
    areaId: z.string().optional(),
    storeId: z.string().optional(),
  })
  .strict();

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

const AssignUserClaimsInputSchema = z.object({
  idToken: z.string().describe("Platform operator's Firebase ID token."),
  targetUid: z.string().min(1),
  role: CanonicalRoleSchema,
  retailerId: z.string().min(1),
  scope: AuthorizationScopeSchema,
});

const AssignUserClaimsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function assignUserClaims(
  input: z.infer<typeof AssignUserClaimsInputSchema>
) {
  try {
    const result = await assignUserClaimsFlow(input);

    return {
      success: !!result?.success,
      message: result?.message || 'Operation completed.',
    };
  } catch (e: any) {
    console.error(
      '[Server Action] Fatal Boundary Error:',
      e?.message || e
    );

    return {
      success: false,
      message: `System Error: ${
        e?.message || 'An unexpected error occurred during provisioning.'
      }`,
    };
  }
}

const assignUserClaimsFlow = ai.defineFlow(
  {
    name: 'assignUserClaimsFlow',
    inputSchema: AssignUserClaimsInputSchema,
    outputSchema: AssignUserClaimsOutputSchema,
  },
  async ({ idToken, targetUid, role, retailerId, scope }) => {
    /**
     * Platform authorization is deliberately separate from retailer
     * authorization.
     *
     * There is no first-user bootstrap and no retailer-side admin bypass.
     */
    const operator = await verifyPlatformOperator(idToken);

    const db = getDb();

    if (!db) {
      return {
        success: false,
        message: 'Infrastructure Layer Unavailable (Firestore).',
      };
    }

    const retailerDoc = await db
      .collection('tenants')
      .doc(retailerId)
      .get();

    if (!retailerDoc.exists) {
      return {
        success: false,
        message: 'Retailer not found.',
      };
    }

    const retailerData = retailerDoc.data();

    if (
      !retailerData ||
      retailerData.status !== 'active'
    ) {
      return {
        success: false,
        message: 'Retailer is not active.',
      };
    }

    const canonicalRole = role as CanonicalRole;
    const authorizationScope = scope as AuthorizationScope;

    if (!isRoleScopeValid(canonicalRole, authorizationScope)) {
      return {
        success: false,
        message: 'Invalid role and authorization scope combination.',
      };
    }

    /**
     * A scope must never point at a different retailer/network.
     */
    if (
      authorizationScope.networkId &&
      authorizationScope.networkId !== retailerId
    ) {
      return {
        success: false,
        message: 'Authorization scope does not belong to the requested retailer.',
      };
    }

    /**
     * Network-level management roles must use the retailer itself
     * as their network scope.
     */
    if (
      (canonicalRole === 'networkOwner' ||
        canonicalRole === 'networkAdmin') &&
      authorizationScope.networkId !== retailerId
    ) {
      return {
        success: false,
        message: 'Network management roles require the retailer network scope.',
      };
    }

    /**
     * Resolve the target identity from Firebase Authentication.
     * Firebase establishes identity; Firestore establishes authorization.
     */
    const targetUser = await admin.auth().getUser(targetUid);

    if (!targetUser.email) {
      return {
        success: false,
        message: 'Target Firebase account does not have an email address.',
      };
    }

    const permissions = getDefaultPermissions(
      canonicalRole
    ) as Permissions;

    /**
     * Authoritative retailer authorization profile.
     *
     * IMPORTANT:
     * No custom claims are written here.
     */
    await db
      .collection('users')
      .doc(targetUid)
      .set(
        {
          uid: targetUid,
          displayName: targetUser.displayName || targetUser.email,
          email: targetUser.email,
          role: canonicalRole,
          retailerId,
          scope: authorizationScope,
          permissions,
          isActive: true,
          provisionedAt:
            admin.firestore.FieldValue.serverTimestamp(),
          provisionedBy: operator.uid,
          updatedAt:
            admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: operator.uid,
          dataStatus: 'VERIFIED',
        },
        { merge: true }
      );

    return {
      success: true,
      message:
        'Authoritative retailer access profile provisioned successfully.',
    };
  }
);
