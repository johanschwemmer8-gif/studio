import type { AuthorizedContext } from './auth-types';

/**
 * Enforces organizational scope for QR-domain resources whose canonical
 * resource boundary is currently a retailer store.
 *
 * The current Store/Deployment model carries storeId but does not yet carry
 * the complete brand/division/region/area hierarchy required to resolve
 * intermediate organizational scopes safely.
 *
 * Therefore:
 * - network scope may access stores within the already-authorized retailer;
 * - store scope may access only its exact store;
 * - intermediate scopes fail closed until authoritative hierarchy resolution
 *   exists.
 *
 * Retailer tenancy and capability authorization remain separate mandatory
 * gates and must be performed by the calling flow.
 */
export function canAccessQrStoreResource(
  actor: AuthorizedContext,
  targetStoreId: string
): boolean {
  if (!actor.isActive || !targetStoreId) {
    return false;
  }

  if (actor.scope.level === 'network') {
    return Boolean(actor.scope.networkId);
  }

  if (actor.scope.level === 'store') {
    return (
      Boolean(actor.scope.storeId) &&
      actor.scope.storeId === targetStoreId
    );
  }

  return false;
}

export function requireQrStoreResourceAccess(
  actor: AuthorizedContext,
  targetStoreId: string
): void {
  if (!canAccessQrStoreResource(actor, targetStoreId)) {
    throw new Error('ACCESS_DENIED: Resource is outside the actor scope.');
  }
}
