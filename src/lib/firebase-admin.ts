
/**
 * @fileoverview Initializes the Firebase Admin SDK for server-side operations.
 */
import admin from 'firebase-admin';

// Initialize the Admin SDK only once
if (!admin.apps.length) {
  try {
    admin.initializeApp();
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
