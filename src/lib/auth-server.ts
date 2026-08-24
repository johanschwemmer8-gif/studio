'use server';
/**
 * @fileOverview Authoritative Server-Side Authorization Helper.
 * IMPLEMENTATION: Hardened Identity Resolution with Firestore Fallback.
 * VERSION: 1.4.0 (Metadata Server Resilience)
 */

import { admin, getDb } from "./firebase-admin";
import { getAuth } from "firebase-admin/auth";

export type AuthorizedContext = {
  uid: string;
  role: 'admin' | 'retailerAdmin' | 'storeManager' | 'analyst';
  retailerId?: string;
};

/**
 * Validates the ID token and returns the authorized context.
 * FALLBACK: If custom claims are missing from the token, checks the Firestore 'users' collection.
 */
export async function verifyAuth(idToken?: string): Promise<AuthorizedContext> {
  if (!idToken) {
    throw new Error('Authentication required.');
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    let role = decodedToken.role as any;
    let retailerId = decodedToken.retailerId as string;

    // FALLBACK LOGIC: If claims are missing, check Firestore directly
    if (!role || !retailerId) {
        const db = getDb();
        if (db) {
            const userDoc = await db.collection('users').doc(decodedToken.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                role = role || userData?.role;
                retailerId = retailerId || userData?.retailerId;
                console.log(`[Auth] Using Firestore Identity Fallback for ${decodedToken.uid}`);
            }
        }
    }

    return {
      uid: decodedToken.uid,
      role: role || 'analyst',
      retailerId,
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    throw new Error('Invalid or expired authentication token.');
  }
}

/**
 * Resolves the authoritative retailerId for a requested operation.
 */
export async function getAuthorizedRetailerId(idToken: string | undefined, requestedRetailerId: string): Promise<string> {
  const auth = await verifyAuth(idToken);
  
  if (auth.role === 'admin') {
    return requestedRetailerId || 'unknown';
  }
  
  if (!auth.retailerId) {
    throw new Error('IDENTITY_NOT_PROVISIONED');
  }
  
  if (requestedRetailerId && requestedRetailerId !== 'unknown' && auth.retailerId !== requestedRetailerId) {
     throw new Error(`ACCESS_DENIED`);
  }
  
  return auth.retailerId;
}
