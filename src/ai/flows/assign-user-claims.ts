'use server';

/**
 * @fileOverview Platform-controlled retailer authorization provisioning.
 *
 * IMPORTANT SECURITY MODEL:
 * - Firebase Authentication establishes identity.
 * - /platformOperators/{uid} establishes platform authorization.
 * - /users/{uid} establishes authoritative retailer authorization.
 * - Firebase custom claims are NOT used for retailer role, scope,
 *   permissions, or tenant assignment.
 *
 * This flow is intentionally restricted to iNteract platform operators.
 * Retailer users cannot call this flow to provision or modify accounts.
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
  'analyst',
]);

const AssignUserClaimsInputSchema = z.object({
  idToken: z.string().describe("Platform operator's Firebase ID token."),
  targetUid: z.string().min(1).describe('Firebase UID of the target user.'),
  role: CanonicalRoleSchema,
  retailerId: z.string().min(1).describe('Authoritative retailer ID.'),
  scope: AuthorizationScopeSchema,
});

const AssignUserClaimsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

function isCanonicalRole(value: unknown): value is CanonicalRole {
  return (
    value === 'networkOwner' ||
    value === 'networkAdmin' ||
    value === 'brandManager' ||
    value === 'divisionManager' ||
    value === 'regionalManager' ||
    value === 'areaManager' ||
    value === 'storeManager' ||
    value === 'analyst'
  );
}

function isPermissions(value: unknown): value is Permissions {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const permissions = value as Record<string, unknown>;

  const requiredPermissions: Array<keyof Permissions> = [
    'dashboard',
    'roi',
    'visualsReporting',
    'realTime',
    'abTesting',
    'systemIntegration',
    'retailMediaNetwork',
    'manageUsers',
    'manageOrganization',
    'approve',
    'export',
  ];

  return requiredPermissions.every(
    (permission) => typeof permissions[permission] === 'boolean'
  );
}

function isAuthorizationScope(value: unknown): value is AuthorizationScope {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const scope = value as Record<string, unknown>;

  if (
    scope.level !== 'network' &&
    scope.level !== 'brand' &&
    scope.level !== 'division' &&
    scope.level !== 'region' &&
    scope.level !== 'area' &&
    scope.level !== 'store'
  ) {
    return false;
  }

  const hierarchyIds = [
    'networkId',
    'brandId',
    'divisionId',
    'regionId',
    'areaId',
    'storeId',
  ] as const;

  return hierarchyIds.every((id) => {
    const present = Boolean(scope[id]);
    return !present || typeof scope[id] === 'string';
  });
}

/**
 * PRIMARY SERVER ACTION
 *
 * Despite the historical function name, this no longer assigns
 * retailer authorization through Firebase custom claims.
 *
 * It provisions the authoritative /users/{uid} retailer profile.
 */
export async function assignUserClaims(
  input: z.infer<typeof AssignUserClaimsInputSchema>
) {
  try {
    const result = await assignUserClaimsFlow(input);

    return {
      success: !!result?.success,
      message: result?.message || 'Operation completed.',
    };
  } catch (error: any) {
    console.error(
      '[Server Action] Fatal Boundary Error:',
      error?.message || error
    );

    return {
      success: false,
      message: `System Error: ${
        error?.message || 'An unexpected error occurred during provisioning.'
      }`,
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
  async ({ idToken, targetUid, role, retailerId, scope }) => {
    /**
     * 1. AUTHORIZE PLATFORM OPERATOR
     *
     * This deliberately does NOT use verifyAuth().
     *
     * Platform authorization is established independently through
     * /platformOperators/{uid}.
     */
    const operator = await verifyPlatformOperator(idToken);

    const db = getDb();

    if (!db) {
      return {
        success: false,
        message: 'Infrastructure Layer Unavailable (Firestore).',
      };
    }

    /**
     * 2. VALIDATE INPUT
     */
    if (!isCanonicalRole(role)) {
      return {
        success: false,
        message: 'Invalid canonical retailer role.',
      };
    }

    if (!isAuthorizationScope(scope)) {
      return {
        success: false,
        message: 'Invalid authorization scope.',
      };
    }

    /**
     * 3. VALIDATE RETAILER
     *
     * The retailer must actually exist.
     */
    const tenantDoc = await db
      .collection('tenants')
      .doc(retailerId)
      .get();

    if (!tenantDoc.exists) {
      return {
        success: false,
        message: `Retailer '${retailerId}' not found.`,
      };
    }

    const tenantData = tenantDoc.data();

    if (
      tenantData &&
      typeof tenantData.status === 'string' &&
      tenantData.status !== 'active'
    ) {
      return {
        success: false,
        message: `Retailer '${retailerId}' is not active.`,
      };
    }

    /**
     * 4. VALIDATE ROLE/SCOPE COMPATIBILITY
     *
     * Reuse the canonical authorization validator rather than
     * duplicating role hierarchy rules here.
     */
    const { isRoleScopeValid } = await import('@/lib/authorization');

    if (!isRoleScopeValid(role, scope)) {
      return {
        success: false,
        message: 'Role and authorization scope are incompatible.',
      };
    }

    /**
     * 5. PREVENT CROSS-TENANT SCOPE ASSIGNMENT
     *
     * The top-level network identifier for the retailer must match
     * the authoritative retailer being provisioned.
     *
     * This prevents a platform operator from accidentally assigning
     * a retailer user to a different network hierarchy.
     */
    if (scope.networkId && scope.networkId !== retailerId) {
      return {
        success: false,
        message:
          'Authorization scope does not belong to the specified retailer.',
      };
    }

    /**
     * Network-level retailer roles must explicitly belong to the
     * retailer being provisioned.
     */
    if (
      (role === 'networkOwner' || role === 'networkAdmin') &&
      scope.level === 'network' &&
      scope.networkId !== retailerId
    ) {
      return {
        success: false,
        message:
          'Network-level authorization must use the specified retailer as networkId.',
      };
    }

    /**
     * 6. BUILD AUTHORITATIVE RETAILER PROFILE
     *
     * Permissions come from the canonical role defaults.
     * They are stored in Firestore and are authoritative there.
     *
     * No retailer role or retailerId is written to Firebase custom claims.
     */
    const permissions = getDefaultPermissions(role);

    if (!isPermissions(permissions)) {
      return {
        success: false,
        message: 'Generated authorization permissions are invalid.',
      };
    }

    /**
     * Resolve the target Firebase Auth identity so the authoritative
     * profile contains the actual identity information.
     */
    const targetUser = await admin.auth().getUser(targetUid);

    const displayName =
      targetUser.displayName ||
      targetUser.email ||
      `User ${targetUser.uid}`;

    const email = targetUser.email || '';

    if (!email) {
      return {
        success: false,
        message:
          'Target Firebase Authentication account does not have an email address.',
      };
    }

    /**
     * 7. WRITE AUTHORITATIVE /users/{uid} PROFILE
     *
     * This is the actual authorization record.
     */
    await db
      .collection('users')
      .doc(targetUid)
      .set(
        {
          uid: targetUid,
          displayName,
          email,
          role,
          retailerId,
          scope,
          permissions,
          isActive: true,
          provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
          provisionedBy: operator.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: operator.uid,
          dataStatus: 'VERIFIED',
        },
        { merge: true }
      );

    /**
     * 8. DO NOT WRITE RETAILER AUTHORIZATION CLAIMS
     *
     * Historically this function called setCustomUserClaims() with:
     *   role
     *   retailerId
     *
     * That behaviour is intentionally removed.
     *
     * The authoritative retailer authorization source is now:
     *   /users/{uid}
     */

    return {
      success: true,
      message: 'Authoritative retailer access profile provisioned successfully.',
    };
  }
);
