'use server';

import type { AuthorizationScope } from '@/lib/auth-types';
import {
  getRetailerUserScopeChildren,
  getRetailerUserScopeContext,
} from '@/lib/retailer-user-scope-options-server';

/**
 * Browser-safe Server Action boundary for retailer user scope assignment.
 *
 * Retailer identity and authority are resolved server-side from the ID token.
 * The browser never supplies retailerId.
 */

export async function getRetailerUserScopeContextAction(input: {
  idToken: string;
}) {
  return getRetailerUserScopeContext(input.idToken);
}

export async function getRetailerUserScopeChildrenAction(input: {
  idToken: string;
  parentScope: AuthorizationScope;
}) {
  return getRetailerUserScopeChildren(
    input.idToken,
    input.parentScope
  );
}
