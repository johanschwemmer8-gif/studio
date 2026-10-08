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

export async function createRetailerUserAction(
  input: CreateRetailerUserInput
): Promise<RetailerManagedUserSummary> {
  return createRetailerUser(input);
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
