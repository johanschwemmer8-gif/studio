
'use server';
/**
 * @fileoverview Initializes the Firebase Admin SDK for server-side operations.
 */
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export const db = admin.firestore();
