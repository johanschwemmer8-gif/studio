import type { AuthorizationScope } from './auth-types';
import {
  listOrganizationScopeChildren,
  type OrganizationScopeChild,
} from './organization-scope-server';

function scopeIdentity(scope: AuthorizationScope): string {
  switch (scope.level) {
    case 'network':
      return scope.networkId ?? '';
    case 'brand':
      return scope.brandId ?? '';
    case 'division':
      return scope.divisionId ?? '';
    case 'region':
      return scope.regionId ?? '';
    case 'area':
      return scope.areaId ?? '';
    case 'store':
      return scope.storeId ?? '';
  }
}

function sameScope(
  left: AuthorizationScope,
  right: AuthorizationScope
): boolean {
  return (
    left.level === right.level &&
    scopeIdentity(left) === scopeIdentity(right)
  );
}

function childIsOnTargetPath(
  child: AuthorizationScope,
  target: AuthorizationScope
): boolean {
  switch (child.level) {
    case 'network':
      return child.networkId === target.networkId;
    case 'brand':
      return child.brandId === target.brandId;
    case 'division':
      return child.divisionId === target.divisionId;
    case 'region':
      return child.regionId === target.regionId;
    case 'area':
      return child.areaId === target.areaId;
    case 'store':
      return child.storeId === target.storeId;
  }
}

export async function resolveRetailerManagedUserScopeDisplayName(
  retailerId: string,
  actorScope: AuthorizationScope,
  targetScope: AuthorizationScope
): Promise<string> {
  if (targetScope.level === 'network') {
    return 'Network';
  }

  /*
   * If actor and target are the same non-network scope, walk from the
   * actor's authoritative parent is not available here. The organization
   * contract therefore resolves the target name by walking from network
   * using the target's authoritative ancestry.
   */
  const networkScope: AuthorizationScope = {
    level: 'network',
    networkId: targetScope.networkId,
  };

  let parentScope = networkScope;

  while (parentScope.level !== 'store') {
    const children: OrganizationScopeChild[] =
      await listOrganizationScopeChildren(
        retailerId,
        parentScope
      );

    const directTarget = children.find(item =>
      sameScope(item.scope, targetScope)
    );

    if (directTarget) {
      return directTarget.displayName;
    }

    const ancestor = children.find(item =>
      childIsOnTargetPath(item.scope, targetScope)
    );

    if (!ancestor) {
      break;
    }

    parentScope = ancestor.scope;
  }

  /*
   * The managed-user command has already authorized targetScope.
   * This fallback avoids exposing raw IDs if organization presentation
   * data is unexpectedly unavailable.
   */
  return targetScope.level.charAt(0).toUpperCase() +
    targetScope.level.slice(1);
}
