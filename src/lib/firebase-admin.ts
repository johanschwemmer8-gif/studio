/**
 * @fileoverview Initializes the Firebase Admin SDK for server-side operations.
 * HARDENED: Checks multiple project identifier sources to ensure cloud parity.
 */
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Attempt to resolve project ID with priority on local .env then cloud metadata
    const projectId = process.env.FIREBASE_PROJECT_ID || 
                      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
                      process.env.GOOGLE_CLOUD_PROJECT ||
                      'interact-aoe-kidkn'; // Absolute fallback for pilot stability

    if (projectId) {
      admin.initializeApp({
        projectId: projectId,
      });
      console.log(`[Admin] Initialized for project: ${projectId}`);
    } else {
      admin.initializeApp();
      console.log("[Admin] Initialized using Default Application Credentials.");
    }
  } catch (e: any) {
    console.warn("Firebase Admin init skipped:", e.message);
  }
}

export const getDb = () => {
    try {
        return admin.firestore();
    } catch (e) {
        console.error("Failed to obtain Firestore instance:", e);
        return null;
    }
};

export { admin };
