'use server';
/**
 * @fileOverview Authoritative Server-Side Authorization Helper.
 * IMPLEMENTATION: Hardened Identity Resolution with Aggressive Retry & Jitter.
 * VERSION: 1.7.0 (High-Availability Loop)
 */

import { admin, getDb } from "./firebase-admin";

export type AuthorizedContext = {
  uid: string;
  role: 'admin' | 'retailerAdmin' | 'storeManager' | 'analyst';
  retailerId?: string;
};

/**
 * Validates the ID token and returns the authorized context.
 * RESILIENCE: Implements an aggressive retry loop for transient cloud handshake errors.
 * FALLBACK: Checks Firestore 'users' if token claims are missing or if the handshake is delayed.
 */
export async function verifyAuth(idToken?: string): Promise<AuthorizedContext> {
  if (!idToken || idToken === '') {
    throw new Error('Authentication required.');
  }

  let lastError: any;
  const maxRetries = 3; // Increased retries

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const auth = admin.auth();
      const decodedToken = await auth.verifyIdToken(idToken);
      
      let role = decodedToken.role as any;
      let retailerId = decodedToken.retailerId as string;

      // FALLBACK: If token lacks claims, check Firestore authoritative record
      if (!role || !retailerId) {
          const db = getDb();
          if (db) {
              const userDoc = await db.collection('users').doc(decodedToken.uid).get();
              if (userDoc.exists) {
                  const userData = userDoc.data();
                  role = role || userData?.role;
                  retailerId = retailerId || userData?.retailerId;
                  console.log(`[Auth] Handshake verified via database fallback for ${decodedToken.uid}`);
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
      
      // Identify transient cloud errors (Metadata/Refresh 500)
      const isTransient = error.message.includes('metadata') || 
                          error.message.includes('refresh') || 
                          error.message.includes('500') ||
                          error.message.includes('UNKNOWN') ||
                          error.code === 'auth/internal-error';

      if (isTransient && attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = Math.floor(Math.random() * 500) + (1000 * Math.pow(2, attempt));
        console.warn(`[Auth] Transient cloud handshake error (Attempt ${attempt + 1}/${maxRetries}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Handle non-transient or exhausted retries
      console.error('[Auth] Verification Failure:', error.code || 'NO_CODE', error.message);
      
      if (isTransient) {
          throw new Error('Identity Service Temporary Unavailable: The cloud handshake timed out after multiple attempts. This is a transient cloud issue. Please refresh the page and try again.');
      }

      if (error.code === 'auth/id-token-expired') {
        throw new Error('Your security session has expired. Please refresh the page to log in again.');
      }
      
      if (error.message.includes('payload') || error.message.includes('object')) {
          throw new Error('Identity Handshake Error: The security payload was malformed. This is usually transient; please refresh and try again.');
      }
      
      throw new Error(`Authentication Error: ${error.message || 'Invalid session.'}`);
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
    throw new Error('IDENTITY_NOT_PROVISIONED: Your account has not been associated with a retailer identity. Please contact a platform administrator.');
  }
  
  if (requestedRetailerId && requestedRetailerId !== 'unknown' && auth.retailerId !== requestedRetailerId) {
     throw new Error(`ACCESS_DENIED: Identity mismatch.`);
  }
  
  return auth.retailerId;
}
