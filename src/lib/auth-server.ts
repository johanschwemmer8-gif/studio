'use server';
/**
 * @fileOverview Authoritative Server-Side Authorization Helper.
 * IMPLEMENTATION: Hardened Identity Resolution with Firestore Fallback.
 * VERSION: 1.4.1 (Standardized Admin Auth)
 */

import { admin, getDb } from "./firebase-admin";

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
  if (!idToken || idToken === '') {
    throw new Error('Authentication required.');
  }

  try {
    // Use the primary admin instance to ensure shared project configuration
    const auth = admin.auth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    let role = decodedToken.role as any;
    let retailerId = decodedToken.retailerId as string;

    // FALLBACK LOGIC: If claims are missing from JWT, check Firestore secondary source
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
  } catch (error: any) {
    console.error('[Auth] Verification Failure:', error.message);
    
    if (error.message.includes('payload') || error.message.includes('object')) {
        throw new Error('Identity Server Handshake Error: The security token payload could not be parsed. Please refresh and try again.');
    }
    
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
