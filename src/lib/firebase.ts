'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getRemoteConfig, type RemoteConfig } from 'firebase/remote-config';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Promise<Analytics | null> | null = null;
let remoteConfig: RemoteConfig | null = null;

// This robust pattern ensures Firebase is initialized correctly once,
// handling both local development and deployed environments.
if (getApps().length === 0) {
  // If the projectId is available via environment variables, we are likely
  // in a local environment. Otherwise, initialize with an empty object
  // to allow Firebase Hosting to auto-configure.
  if (firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
  } else {
    app = initializeApp({});
  }
} else {
  app = getApp();
}

db = getFirestore(app);
auth = getAuth(app);


if (typeof window !== 'undefined') {
    analytics = isSupported().then((supported) => {
        if(supported) {
            return getAnalytics(app);
        }
        return null;
    });

    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
    remoteConfig.defaultConfig = {
        'in_store_greeting_message': 'Welcome to our store!',
    };
}

export { db, auth, analytics, remoteConfig };
