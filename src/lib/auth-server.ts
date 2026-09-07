'use server';

/**
 * @fileOverview Authoritative Server-Side Authentication and Authorization Context.
 *
 * Firebase Authentication establishes identity.
 * Firestore /users/{uid} establishes authoritative retailer authorization.
 *
 * Firebase custom claims are deliberately not trusted for retailer role,
 * scope, permissions, or tenant assignment.
 */

import { admin, getDb } from './firebase-admin';
import {
  AuthorizationDecision,
  AuthorizationScope,
  AuthorizedContext,
  CanonicalRole,
  Permissions,
  UserAuthorizationProfile,
} from './auth-types';
import { isRoleScopeValid } from './authorization';

export type AuthFailure = {
  uid: '';
  error: string;
};

export type AuthResult = AuthorizedContext | AuthFailure;

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

function isValidAuthorizationProfile(
  value: unknown,
  expectedUid: string
): value is UserAuthorizationProfile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const profile = value as Record<string, unknown>;

  if (profile.uid !== expectedUid) {
    return false;
  }

  if (typeof profile.retailerId !== 'string' || profile.retailerId === '') {
    return false;
  }

  if (typeof profile.displayName !== 'string') {
    return false;
  }

  if (typeof profile.email !== 'string') {
    return false;
  }

  if (!isCanonicalRole(profile.role)) {
    return false;
  }

  if (!isAuthorizationScope(profile.scope)) {
    return false;
  }

  if (!isRoleScopeValid(profile.role, profile.scope)) {
    return false;
  }

  if (!isPermissions(profile.permissions)) {
    return false;
  }

  if (profile.isActive !== true) {
    return false;
  }

  return true;
}

function authenticationFailure(error: string): AuthFailure {
  return {
    uid: '',
    error,
  };
}

/**
 * Validates the Firebase ID token and resolves the authoritative
 * retailer authorization profile from /users/{uid}.
 *
 * Firebase provides identity.
 * Firestore provides authorization.
 */
export async function verifyAuth(idToken?: string): Promise<AuthResult> {
  if (!idToken) {
    return authenticationFailure(
      'Authentication required: No session token provided.'
    );
  }

  const maxRetries = 5;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const auth = admin.auth();
      const decodedToken = await auth.verifyIdToken(idToken);

      const db = getDb();

      if (!db) {
        throw new Error('Authorization database unavailable.');
      }

      const userDoc = await db
        .collection('users')
        .doc(decodedToken.uid)
        .get();

      if (!userDoc.exists) {
        return authenticationFailure(
          'IDENTITY_NOT_PROVISIONED: Authoritative user profile not found.'
        );
      }

      const userData = userDoc.data();

      /**
       * Explicitly reject inactive accounts.
       *
       * This is deliberately checked before full authorization-profile
       * validation so an inactive account receives a distinct failure
       * rather than being treated merely as malformed.
       */
      if (
        userData &&
        typeof userData === 'object' &&
        (userData as Record<string, unknown>).isActive === false
      ) {
        return authenticationFailure(
          'ACCOUNT_INACTIVE: User account is inactive.'
        );
      }

      if (!isValidAuthorizationProfile(userData, decodedToken.uid)) {
        return authenticationFailure(
          'INVALID_AUTHORIZATION_PROFILE: Authoritative user profile is invalid.'
        );
      }

      return {
        uid: userData.uid,
        retailerId: userData.retailerId,
        role: userData.role,
        scope: userData.scope,
        permissions: userData.permissions,
        isActive: userData.isActive,
      };
    } catch (error: any) {
      const message =
        typeof error?.message === 'string' ? error.message : '';

      const isTransient =
        message.includes('metadata') ||
        message.includes('refresh') ||
        message.includes('500') ||
        message.includes('UNKNOWN') ||
        error?.code === 'auth/internal-error';

      if (isTransient && attempt < maxRetries) {
        const delay =
          1000 * Math.pow(2, attempt) + Math.random() * 500;

        console.warn(
          `[Auth] Handshake Friction (Attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(delay)}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      console.error(
        '[Auth] Verification Failure:',
        error?.code || 'ERR',
        message
      );

      if (error?.code === 'auth/id-token-expired') {
        return authenticationFailure(
          'Your session has expired. Please log out and back in.'
        );
      }

      if (isTransient) {
        return authenticationFailure(
          'Identity Service Busy: The cloud handshake timed out. Please refresh and try again.'
        );
      }

      return authenticationFailure('Authentication failed.');
    }
  }

  return authenticationFailure(
    'Identity Service Unavailable: Maximum retries exceeded.'
  );
}

/**
 * Resolves the authoritative retailerId for a requested operation.
 *
 * There is deliberately no retailer-side admin bypass.
 */
export async function getAuthorizedRetailerId(
  idToken: string | undefined,
  requestedRetailerId: string
): Promise<string> {
  const auth = await verifyAuth(idToken);

  if (auth.error) {
    throw new Error(auth.error);
  }

  if (!auth.retailerId) {
    throw new Error(
      'IDENTITY_NOT_PROVISIONED: Account not linked to a retailer.'
    );
  }

  if (
    requestedRetailerId &&
    requestedRetailerId !== 'unknown' &&
    auth.retailerId !== requestedRetailerId
  ) {
    throw new Error('ACCESS_DENIED: Tenant mismatch.');
  }

  return auth.retailerId;
}
