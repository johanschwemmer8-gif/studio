
/**
 * @fileoverview Initializes the Firebase Admin SDK for server-side operations.
 */
import admin from 'firebase-admin';

// Initialize the Admin SDK only once
if (!admin.apps.length) {
  try {
    // Attempt to initialize with project ID from any available source.
    // In some environments, GOOGLE_CLOUD_PROJECT is the primary reliable source.
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
                      process.env.FIREBASE_PROJECT_ID || 
                      process.env.GOOGLE_CLOUD_PROJECT;

    if (projectId) {
      admin.initializeApp({
        projectId: projectId,
      });
      console.log(`[Admin] Initialized successfully for project: ${projectId}`);
    } else {
      // Fallback to default initialization if no project ID is found in env
      admin.initializeApp();
      console.log("[Admin] Initialized using default credentials.");
    }
  } catch (e: any) {
    console.warn("Firebase Admin initialization skipped or already initialized:", e.message);
  }
}

/**
 * Provides a safe reference to Firestore.
 * Using a getter prevents initialization errors during module import.
 */
export const getDb = () => {
    try {
        return admin.firestore();
    } catch (e) {
        console.error("Failed to obtain Firestore Admin instance:", e);
        return null;
    }
};

export { admin };
