
'use server';
/**
 * @fileOverview Authoritative Server-Side Authorization Helper.
 * Enforces tenant isolation and role-based access control.
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
  
  // Strict Tenant Isolation Gate
  if (auth.retailerId !== requestedRetailerId && requestedRetailerId !== 'simulated-retailer-id') {
     throw new Error(`Access Denied: Unauthorized tenant access attempt for ${requestedRetailerId}.`);
  }
  
  // Use the verified claim as the primary identity
  return auth.retailerId;
}
