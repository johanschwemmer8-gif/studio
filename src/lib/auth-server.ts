'use server';

/**
 * @fileOverview Authoritative Server-Side Authentication (Reverted)
 */

import { admin, getDb } from './firebase-admin';
import {
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
  return [
    'networkOwner', 'networkAdmin', 'brandManager', 'divisionManager',
    'regionalManager', 'areaManager', 'storeManager', 'storeUser', 'analyst'
  ].includes(value as string);
}

function isPermissions(value: unknown): value is Permissions {
  return !!value && typeof value === 'object';
}

function isAuthorizationScope(value: unknown): value is AuthorizationScope {
  return !!value && typeof value === 'object';
}

function isValidAuthorizationProfile(
  value: unknown,
  expectedUid: string
): value is UserAuthorizationProfile {
  const profile = value as any;
  return profile && profile.uid === expectedUid && profile.isActive === true;
}

export async function verifyAuth(idToken?: string): Promise<AuthResult> {
  if (!idToken) {
    return { uid: '', error: 'Authentication required.' };
  }

  try {
    const auth = admin.auth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const db = getDb();

    if (!db) throw new Error('DB unavailable.');

    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return { uid: '', error: 'User profile not found.' };
    }

    const userData = userDoc.data() as any;

    return {
      uid: userData.uid,
      retailerId: userData.retailerId,
      role: userData.role,
      scope: userData.scope,
      permissions: userData.permissions,
      isActive: userData.isActive,
    };
  } catch (error: any) {
    console.error('[Auth] Failure:', error.message);
    return { uid: '', error: 'Authentication failed.' };
  }
}

export async function getAuthorizedRetailerId(
  idToken: string | undefined,
  requestedRetailerId: string
): Promise<string> {
  const auth = await verifyAuth(idToken);
  if ('error' in auth) throw new Error(auth.error);
  return auth.retailerId || 'unknown';
}

export async function verifyPlatformOperator(
  idToken?: string
): Promise<{ uid: string; email?: string }> {
  if (!idToken) throw new Error('Auth required.');
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  return { uid: decodedToken.uid, email: decodedToken.email };
}
