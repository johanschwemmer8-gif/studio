'use server';
/**
 * @fileOverview Authoritative Server-Side Authorization Helper.
 * IMPLEMENTATION: Hardened Identity Resolution with Structured Error Handling.
 * VERSION: 2.2.0 (High-Availability Retries)
 */

import { admin, getDb } from "./firebase-admin";

export type AuthorizedContext = {
  uid: string;
  role: 'admin' | 'retailerAdmin' | 'storeManager' | 'analyst';
  retailerId?: string;
  error?: string;
};

/**
 * Validates the ID token and returns the authorized context.
 * LATENCY OPTIMIZED: Uses exponential backoff for transient cloud failures.
 * DESIGN: Returns a context object with an 'error' field instead of throwing.
 */
export async function verifyAuth(idToken?: string): Promise<AuthorizedContext> {
  if (!idToken || idToken === '') {
    return { uid: '', role: 'analyst', error: 'Authentication required: No session token provided.' };
  }

  // Increased retries to handle transient metadata service failures in GCP environments.
  const maxRetries = 3; 

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
      const isTransient = 
        error.message.includes('metadata') || 
        error.message.includes('refresh') || 
        error.message.includes('500') ||
        error.message.includes('UNKNOWN') ||
        error.code === 'auth/internal-error';

      if (isTransient && attempt < maxRetries) {
        // Incremental backoff with jitter to recover from metadata service hiccups
        const delay = (500 * Math.pow(2, attempt)) + (Math.random() * 200);
        console.warn(`[Auth] Handshake Friction (Attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      console.error('[Auth] Verification Failure:', error.code || 'ERR', error.message);
      
      let message = "Authentication failed.";
      if (isTransient) message = "Identity Service Busy: The cloud handshake timed out. Please refresh and try again.";
      if (error.code === 'auth/id-token-expired') message = "Your session has expired. Please log out and back in.";

      return { uid: '', role: 'analyst', error: message };
    }
  }
  
  return { uid: '', role: 'analyst', error: "Identity Service Unavailable: Maximum retries exceeded." };
}

/**
 * Resolves the authoritative retailerId for a requested operation.
 */
export async function getAuthorizedRetailerId(idToken: string | undefined, requestedRetailerId: string): Promise<string> {
  const auth = await verifyAuth(idToken);
  
  if (auth.error) {
      throw new Error(auth.error); 
  }

  if (auth.role === 'admin') {
    return requestedRetailerId || 'unknown';
  }
  
  if (!auth.retailerId) {
    throw new Error('IDENTITY_NOT_PROVISIONED: Account not linked to a retailer.');
  }
  
  if (requestedRetailerId && requestedRetailerId !== 'unknown' && auth.retailerId !== requestedRetailerId) {
     throw new Error(`ACCESS_DENIED: Tenant mismatch.`);
  }
  
  return auth.retailerId;
}
