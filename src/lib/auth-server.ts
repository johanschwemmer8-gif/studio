'use server';
/**
 * @fileOverview Authoritative Server-Side Authorization Helper.
 * Enforces tenant isolation and role-based access control.
 * VERSION: 1.3.0 (Security Hardened - No Bypass)
 */

import { admin } from "./firebase-admin";
import { getAuth } from "firebase-admin/auth";

export type AuthorizedContext = {
  uid: string;
  role: 'admin' | 'retailerAdmin' | 'storeManager' | 'analyst';
  retailerId?: string;
};

/**
 * Validates the ID token and returns the authorized context.
 * Fails closed if token is invalid or missing.
 */
export async function verifyAuth(idToken?: string): Promise<AuthorizedContext> {
  if (!idToken) {
    throw new Error('Authentication required.');
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      role: (decodedToken.role as any) || 'analyst',
      retailerId: decodedToken.retailerId as string,
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    throw new Error('Invalid or expired authentication token.');
  }
}

/**
 * Resolves the authoritative retailerId for a requested operation.
 * If user is platform admin, they can access any requested retailer.
 * If user is a retailer user, they can ONLY access their claimed retailer.
 */
export async function getAuthorizedRetailerId(idToken: string | undefined, requestedRetailerId: string): Promise<string> {
  const auth = await verifyAuth(idToken);
  
  if (auth.role === 'admin') {
    return requestedRetailerId;
  }
  
  if (!auth.retailerId) {
    throw new Error('User has no associated retailer identity.');
  }
  
  // STRICT TENANT ISOLATION
  // The authenticated claim is the source of truth.
  if (requestedRetailerId && auth.retailerId !== requestedRetailerId) {
     throw new Error(`Access Denied: Unauthorized tenant access attempt.`);
  }
  
  return auth.retailerId;
}