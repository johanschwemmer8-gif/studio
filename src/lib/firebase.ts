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

// Robust initialization for both local and deployed environments (including build-time)
if (!getApps().length) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
  } else {
    // During Next.js build/SSG, env vars are often missing.
    // We attempt a generic init or a named fallback to prevent build crashes.
    try {
      // If running on GCP (like App Hosting), this might pick up environment defaults
      app = initializeApp({});
    } catch (e) {
      console.warn("[Firebase] Using build-time placeholder project ID.");
      app = initializeApp({
        apiKey: "build-placeholder",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "interact-aoe-kidkn",
        appId: "build-placeholder"
      }, "BUILD_TIME_APP");
    }
  }
} else {
  app = getApp();
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

let analytics: Promise<Analytics | null> | null = null;
let remoteConfig: RemoteConfig | null = null;

// Only initialize browser-only services on the client side with valid config
if (typeof window !== 'undefined' && app.options?.apiKey && app.name !== "BUILD_TIME_APP") {
    if (app.options.measurementId) {
        analytics = (async () => {
            if (await isSupported()) {
                return getAnalytics(app);
            }
            return null;
        })();
    }
    
    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000;
    remoteConfig.defaultConfig = {
        'in_store_greeting_message': 'Welcome to our store!',
    };
}

export { db, auth, analytics, remoteConfig };
