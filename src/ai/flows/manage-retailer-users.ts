'use server';

import {
  createRetailerUser,
  listRetailerManagedUsers,
  reactivateRetailerUser,
  suspendRetailerUser,
  updateRetailerUserAuthorization,
  type CreateRetailerUserInput,
  type RetailerManagedUserSummary,
  type UpdateRetailerUserAuthorizationInput,
} from '@/lib/retailer-user-management-server';
import {
  resolveRetailerManagedUserScopeDisplayName,
} from '@/lib/retailer-managed-user-scope-display-server';
import { verifyAuth } from '@/lib/auth-server';

/**
 * Server Action boundary for retailer user administration.
 *
 * Authentication, tenant isolation, role authority, organisational-scope
 * containment and Sidebar Access validation remain authoritative in
 * retailer-user-management-server.ts.
 *
 * This module exists to keep Firebase Admin dependencies out of client
 * bundles while exposing the canonical R3.3.2 command layer to R3.4 UX.
 */

export async function listRetailerManagedUsersAction(input: {
  idToken: string;
}): Promise<RetailerManagedUserSummary[]> {
  return listRetailerManagedUsers(input);
}

export type CreateRetailerUserActionResult =
  | {
      success: true;
      user: RetailerManagedUserSummary;
    }
  | {
      success: false;
      message: string;
    };

export async function createRetailerUserAction(
  input: CreateRetailerUserInput
): Promise<CreateRetailerUserActionResult> {
  try {
    const user = await createRetailerUser(input);

    return {
      success: true,
      user,
    };
  } catch (error) {
    const code =
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : null;

    if (code === 'auth/email-already-exists') {
      return {
        success: false,
        message:
          'This email address is already associated with an account. Please use another email address.',
      };
    }

    throw error;
  }
}

export async function updateRetailerUserAuthorizationAction(
  input: UpdateRetailerUserAuthorizationInput
): Promise<RetailerManagedUserSummary> {
  return updateRetailerUserAuthorization(input);
}

export async function suspendRetailerUserAction(input: {
  idToken: string;
  targetUid: string;
}): Promise<RetailerManagedUserSummary> {
  return suspendRetailerUser(input);
}

export async function reactivateRetailerUserAction(input: {
  idToken: string;
  targetUid: string;
}): Promise<RetailerManagedUserSummary> {
  return reactivateRetailerUser(input);
}


export type RetailerManagedUserDisplaySummary = RetailerManagedUserSummary & {
  scopeDisplayName: string;
};

export async function listRetailerManagedUserDisplaySummariesAction(input: {
  idToken: string;
}): Promise<RetailerManagedUserDisplaySummary[]> {
  const actor = await verifyAuth(input.idToken);

  if ('error' in actor || !actor.retailerId) {
    throw new Error(
      'USER_MANAGEMENT_AUTH_FAILED: Unable to resolve retailer authority.'
    );
  }

  const retailerId = actor.retailerId;
  const users = await listRetailerManagedUsers(input);

  return Promise.all(
    users.map(async managedUser => ({
      ...managedUser,
      scopeDisplayName:
        await resolveRetailerManagedUserScopeDisplayName(
          retailerId,
          actor.scope,
          managedUser.scope
        ),
    }))
  );
}
