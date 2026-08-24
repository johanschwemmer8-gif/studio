
/**
 * @fileoverview Initializes the Firebase Admin SDK for server-side operations.
 */
import admin from 'firebase-admin';

// Initialize the Admin SDK only once
if (!admin.apps.length) {
  try {
    // Explicitly set the project ID from environment variables to ensure
    // that the Admin SDK is anchored to the correct Firebase project for token verification.
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    });
  } catch (e) {
    console.warn("Firebase Admin initialization skipped or already initialized.");
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
