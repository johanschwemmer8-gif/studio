import {
  AuthorizationDecision,
  AuthorizationScope,
  AuthorizedContext,
  CanonicalRole,
  Permission,
  ROLE_AUTHORITY,
  ROLE_SCOPE_LEVEL,
  UserAuthorizationProfile,
} from './auth-types';

/**
 * Returns true when `child` is the same scope as `parent` or is
 * contained within the parent's hierarchy scope.
 *
 * Scope containment follows the organization hierarchy:
 * network > brand > division > region > area > store.
 *
 * A parent scope therefore includes all of its descendants.
 */
export function isScopeWithin(
  child: AuthorizationScope,
  parent: AuthorizationScope
): boolean {
  if (parent.level === 'platform') {
    return true;
  }

  if (child.level === 'platform') {
    return false;
  }

  if (parent.level === 'network') {
    return Boolean(
      parent.networkId &&
      child.networkId &&
      parent.networkId === child.networkId
    );
  }

  const hierarchy: Array<{
    level: AuthorizationScope['level'];
    id: keyof AuthorizationScope;
  }> = [
    { level: 'brand', id: 'brandId' },
    { level: 'division', id: 'divisionId' },
    { level: 'region', id: 'regionId' },
    { level: 'area', id: 'areaId' },
    { level: 'store', id: 'storeId' },
  ];

  const parentIndex = hierarchy.findIndex((item) => item.level === parent.level);
  const childIndex = hierarchy.findIndex((item) => item.level === child.level);

  if (parentIndex === -1 || childIndex === -1) {
    return false;
  }

  if (childIndex < parentIndex) {
    return false;
  }

  const parentId = parent[hierarchy[parentIndex].id];
  const childParentId = child[hierarchy[parentIndex].id];

  if (!parentId || !childParentId || parentId !== childParentId) {
    return false;
  }

  return true;
}

/**
 * Returns true when a role has sufficient authority to manage another role.
 *
 * A user may manage roles strictly below their own authority level.
 * Equal or higher authority roles cannot be managed.
 *
 * platformAdmin is the sole platform-level authority.
 */
export function canManageRole(
  actorRole: CanonicalRole,
  targetRole: CanonicalRole
): boolean {
  if (actorRole === 'platformAdmin') {
    return targetRole !== 'platformAdmin';
  }

  if (targetRole === 'platformAdmin') {
    return false;
  }

  return ROLE_AUTHORITY[actorRole] > ROLE_AUTHORITY[targetRole];
}

/**
 * Validates that a role's assigned scope is structurally valid.
 *
 * Analysts intentionally have no inferred scope and therefore require
 * an explicit scope assignment.
 */
export function isRoleScopeValid(
  role: CanonicalRole,
  scope: AuthorizationScope
): boolean {
  const expectedLevel = ROLE_SCOPE_LEVEL[role];

  if (role === 'platformAdmin') {
    return (
      scope.level === 'platform' &&
      !scope.networkId &&
      !scope.brandId &&
      !scope.divisionId &&
      !scope.regionId &&
      !scope.areaId &&
      !scope.storeId
    );
  }

  if (role !== 'analyst' && expectedLevel && scope.level !== expectedLevel) {
    return false;
  }

  if (scope.level === 'platform') {
    return false;
  }

  if (!scope.networkId) {
    return false;
  }

  if (scope.level === 'brand' && !scope.brandId) {
    return false;
  }

  if (scope.level === 'division' && (!scope.brandId || !scope.divisionId)) {
    return false;
  }

  if (
    scope.level === 'region' &&
    (!scope.brandId || !scope.divisionId || !scope.regionId)
  ) {
    return false;
  }

  if (
    scope.level === 'area' &&
    (!scope.brandId ||
      !scope.divisionId ||
      !scope.regionId ||
      !scope.areaId)
  ) {
    return false;
  }

  if (
    scope.level === 'store' &&
    (!scope.brandId ||
      !scope.divisionId ||
      !scope.regionId ||
      !scope.areaId ||
      !scope.storeId)
  ) {
    return false;
  }

  return true;
}

/**
 * Checks whether a user has a specific functional permission.
 *
 * Permissions never expand hierarchy scope.
 */
export function hasPermission(
  context: AuthorizedContext,
  permission: Permission
): boolean {
  return context.isActive && context.permissions[permission] === true;
}

/**
 * Determines whether an actor may manage a target user.
 *
 * This combines:
 * - active actor status
 * - same retailer/network
 * - role authority
 * - target scope containment
 * - valid target role/scope pairing
 * - manageUsers permission
 */
export function canManageUser(
  actor: AuthorizedContext,
  target: UserAuthorizationProfile
): AuthorizationDecision {
  if (!actor.isActive) {
    return {
      allowed: false,
      reason: 'Actor account is inactive.',
    };
  }

  if (
    actor.role !== 'platformAdmin' &&
    !hasPermission(actor, 'manageUsers')
  ) {
    return {
      allowed: false,
      reason: 'Actor does not have user-management permission.',
    };
  }

  if (actor.role !== 'platformAdmin' && actor.retailerId !== target.retailerId) {
    return {
      allowed: false,
      reason: 'Target user belongs to a different retailer.',
    };
  }

  if (!canManageRole(actor.role, target.role)) {
    return {
      allowed: false,
      reason: 'Target role has equal or higher authority.',
    };
  }

  if (!isRoleScopeValid(target.role, target.scope)) {
    return {
      allowed: false,
      reason: 'Target role and scope are inconsistent.',
    };
  }

  if (
    actor.role !== 'platformAdmin' &&
    !isScopeWithin(target.scope, actor.scope)
  ) {
    return {
      allowed: false,
      reason: 'Target user is outside the actor scope.',
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Determines whether an actor may access a requested hierarchy scope.
 *
 * This is separate from permission checking: a permission does not
 * automatically grant access outside the actor's organizational scope.
 */
export function canAccessScope(
  actor: AuthorizedContext,
  requestedScope: AuthorizationScope
): AuthorizationDecision {
  if (!actor.isActive) {
    return {
      allowed: false,
      reason: 'Actor account is inactive.',
    };
  }

  if (actor.role === 'platformAdmin') {
    return {
      allowed: true,
    };
  }

  if (!actor.retailerId) {
    return {
      allowed: false,
      reason: 'Actor has no retailer assignment.',
    };
  }

  if (!isScopeWithin(requestedScope, actor.scope)) {
    return {
      allowed: false,
      reason: 'Requested scope is outside the actor scope.',
    };
  }

  return {
    allowed: true,
  };
}
