'use server';
/**
 * @fileOverview Authoritative Server-Side Authorization Helper.
 * IMPLEMENTATION: Hardened Identity Resolution with Firestore Fallback.
 * VERSION: 1.5.0 (Transient Error Retry & Handshake Resilience)
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
 * RESILIENCE: Implements a retry for transient cloud handshake errors (500s).
 */
export async function verifyAuth(idToken?: string): Promise<AuthorizedContext> {
  if (!idToken || idToken === '') {
    throw new Error('Authentication required.');
  }

  let lastError: any;
  const maxRetries = 2;

  for (let attempt = 0; i <= maxRetries; attempt++) {
    try {
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
      lastError = error;
      
      // Check for transient cloud errors (Metadata 500)
      const isTransient = error.message.includes('metadata') || 
                          error.message.includes('refresh') || 
                          error.message.includes('500') ||
                          error.message.includes('UNKNOWN');

      if (isTransient && attempt < maxRetries) {
        console.warn(`[Auth] Transient handshake error (Attempt ${attempt + 1}). Retrying...`);
        // Wait a small amount before retry
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }

      // If we reach here, it's either a non-transient error or we're out of retries
      console.error('[Auth] Verification Failure:', error.code || 'NO_CODE', error.message);
      
      if (isTransient) {
          throw new Error('Identity Service Temporary Unavailable: The cloud security handshake timed out (Error 500). Please refresh the page and try again.');
      }

      if (error.code === 'auth/id-token-expired') {
        throw new Error('Your security session has expired. Please refresh the page and try again.');
      }
      
      if (error.message.includes('payload') || error.message.includes('object')) {
          throw new Error('Identity Server Handshake Error: The cloud security payload is temporarily unavailable. Please refresh the page and try again.');
      }
      
      throw new Error(`Authentication Error: ${error.message || 'Invalid or expired token.'}`);
    }
  }
  
  throw lastError;
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
