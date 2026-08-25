
/**
 * @fileoverview Initializes the Firebase Admin SDK for server-side operations.
 * HARDENED: Prioritizes explicit environment project resolution for the iNteract platform.
 */
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Attempt to resolve project ID from multiple sources
    const projectId = process.env.FIREBASE_PROJECT_ID || 
                      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
                      process.env.GOOGLE_CLOUD_PROJECT;

    if (projectId) {
      admin.initializeApp({
        projectId: projectId,
      });
      console.log(`[Admin] Initialized for project: ${projectId}`);
    } else {
      // Automatic detection for App Hosting / Cloud Run environments
      admin.initializeApp();
      console.log("[Admin] Initialized using Default Application Credentials.");
    }
  } catch (e: any) {
    console.warn("[Admin] Initialization Friction:", e.message);
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

export const db = admin.firestore();

export { admin };
