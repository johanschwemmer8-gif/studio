
'use server';
/**
 * @fileOverview Authoritative Server-Side Authorization Helper.
 * IMPLEMENTATION: Hardened Identity Resolution with Aggressive Retry & Jitter.
 * VERSION: 1.8.0 (Ultra-Resilient Identity Loop)
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
    throw new Error('Authentication required: No security token provided. Please refresh the page and sign in again.');
  }

  let lastError: any;
  const maxRetries = 5; // Increased to 5 attempts for extreme resilience

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
                  console.log(`[Auth] Identity verified via Database Fallback for ${decodedToken.uid}`);
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
      
      // Identify transient cloud errors (Metadata/Refresh 500, Socket Hangup, etc.)
      const isTransient = 
        error.message.includes('metadata') || 
        error.message.includes('refresh') || 
        error.message.includes('500') ||
        error.message.includes('UNKNOWN') ||
        error.message.includes('socket') ||
        error.message.includes('timeout') ||
        error.code === 'auth/internal-error';

      if (isTransient && attempt < maxRetries) {
        // Exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s...
        const delay = Math.floor(Math.random() * 1000) + (1000 * Math.pow(2, attempt));
        console.warn(`[Auth] Cloud Handshake Delayed (Attempt ${attempt + 1}/${maxRetries}). Retrying in ${delay}ms... Details: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Handle non-transient or exhausted retries
      console.error('[Auth] Verification Failure:', error.code || 'NO_CODE', error.message);
      
      if (isTransient) {
          throw new Error(`Identity Service Unavailable: The security handshake timed out after ${maxRetries} attempts. This is usually a transient cloud connectivity issue. Please refresh the page and try again. Internal Trace: ${error.message.substring(0, 50)}...`);
      }

      if (error.code === 'auth/id-token-expired') {
        throw new Error('Your security session has expired. Please refresh the page to log in again.');
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
     throw new Error(`ACCESS_DENIED: You are not authorized to perform operations for this tenant.`);
  }
  
  return auth.retailerId;
}
