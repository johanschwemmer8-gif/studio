'use server';

import {
  createPlatformRetailerUser,
  type CreatePlatformManagedRetailerUserInput,
  type PlatformManagedUserSummary,
} from '@/lib/platform-user-management-server';

/**
 * Server Action boundary for Platform Operator retailer-user provisioning.
 *
 * Authority and validation remain in platform-user-management-server.ts.
 * This module exists only to prevent Firebase Admin dependencies from
 * crossing into client bundles.
 */
export async function createPlatformRetailerUserAction(
  input: CreatePlatformManagedRetailerUserInput
): Promise<PlatformManagedUserSummary> {
  return createPlatformRetailerUser(input);
}
