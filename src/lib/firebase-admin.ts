
/**
 * @fileoverview Initializes the Firebase Admin SDK for server-side operations.
 */
import admin from 'firebase-admin';

// In a real Firebase environment (like Cloud Functions or Cloud Run),
// the Admin SDK is initialized without arguments.
if (!admin.apps.length) {
  admin.initializeApp();
}

// For local development where you might not have the default credentials
// set up, you could conditionally provide a service account like this,
// but it's not recommended for production code committed to a repository.
// In a real app, you would rely on Application Default Credentials.
//
// if (process.env.NODE_ENV !== 'production' && !admin.apps.length) {
//   const serviceAccount = require('../path/to/your/serviceAccountKey.json');
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
//   });
// }

const db = admin.firestore();

export { admin, db };
