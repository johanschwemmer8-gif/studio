import type {
  AuthorizationScope,
  CanonicalRole,
} from './auth-types';
import {
  canAccessScope,
  canManageRole,
} from './authorization';
import { verifyAuth } from './auth-server';
import {
  listOrganizationScopeChildren,
  type OrganizationScopeChild,
} from './organization-scope-server';
import { requireRetailerUserManager } from './retailer-user-management-server';

export type RetailerUserScopeContext = {
  actorRole: CanonicalRole;
  actorScope: AuthorizationScope;
  eligibleRoles: CanonicalRole[];
};

const CANONICAL_ROLES: readonly CanonicalRole[] = [
  'networkOwner',
  'networkAdmin',
  'brandManager',
  'divisionManager',
  'regionalManager',
  'areaManager',
  'storeManager',
  'storeUser',
  'analyst',
];

async function requireAuthoritativeActor(idToken: string) {
  const actor = await verifyAuth(idToken);

  if ('error' in actor) {
    throw new Error(
      `USER_SCOPE_OPTIONS_AUTH_FAILED: ${actor.error || 'Authentication failed.'}`
    );
  }

  requireRetailerUserManager(actor);

  if (!actor.retailerId) {
    throw new Error(
      'USER_SCOPE_OPTIONS_FORBIDDEN: Actor has no authoritative retailer.'
    );
  }

  return {
    ...actor,
    retailerId: actor.retailerId,
  } as typeof actor & { retailerId: string };
}

/**
 * Returns the authoritative starting context for retailer user assignment.
 *
 * The retailer is always derived from the authenticated actor.
 * The browser never supplies retailer authority.
 */
export async function getRetailerUserScopeContext(
  idToken: string
): Promise<RetailerUserScopeContext> {
  const actor = await requireAuthoritativeActor(idToken);

  return {
    actorRole: actor.role,
    actorScope: actor.scope,
    eligibleRoles: CANONICAL_ROLES.filter(role =>
      canManageRole(actor.role, role)
    ),
  };
}

/**
 * Returns immediate organisation children beneath an authorised parent scope.
 *
 * Security invariant:
 * - retailerId comes from the authenticated actor
 * - requested parent must be inside actor scope
 * - authoritative organisation configuration remains the source of truth
 */
export async function getRetailerUserScopeChildren(
  idToken: string,
  parentScope: AuthorizationScope
): Promise<OrganizationScopeChild[]> {
  const actor = await requireAuthoritativeActor(idToken);

  const decision = canAccessScope(actor, parentScope);

  if (!decision.allowed) {
    throw new Error(
      `USER_SCOPE_OPTIONS_FORBIDDEN: ${
        decision.reason || 'Requested scope is outside management authority.'
      }`
    );
  }

  return listOrganizationScopeChildren(
    actor.retailerId,
    parentScope
  );
}
