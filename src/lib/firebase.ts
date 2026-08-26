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
  // App Hosting automatically injects FIREBASE_WEBAPP_CONFIG during build
  let finalConfig = firebaseConfig;
  if (!finalConfig.apiKey && typeof process !== 'undefined' && process.env.FIREBASE_WEBAPP_CONFIG) {
    try {
      finalConfig = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
    } catch (e) {
      console.warn("[Firebase] Failed to parse injected webapp config.");
    }
  }

  // If we still don't have a config (e.g. during CI build step), use a fallback to prevent build crashes
  if (finalConfig.apiKey && finalConfig.projectId) {
    app = initializeApp(finalConfig);
  } else {
    // Stable fallback for static page generation in CI environments (prevents projectId error)
    app = initializeApp({
      apiKey: "build-placeholder",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "interact-aoe-kidkn",
      appId: "build-placeholder"
    });
    console.log("[Firebase] Initialized with build-time placeholder.");
  }
} else {
  app = getApp();
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

let analytics: Promise<Analytics | null> | null = null;
let remoteConfig: RemoteConfig | null = null;

// Only initialize browser-only services on the client side with valid config
if (typeof window !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (firebaseConfig.measurementId) {
        analytics = (async () => {
            if (await isSupported()) {
                return getAnalytics(app);
            }
            return null;
        })();
    }
    
    try {
        remoteConfig = getRemoteConfig(app);
        remoteConfig.settings.minimumFetchIntervalMillis = 3600000;
        remoteConfig.defaultConfig = {
            'in_store_greeting_message': 'Welcome to our store!',
        };
    } catch (e) {
        console.warn("[Firebase] Remote Config initialization deferred.");
    }
}

export { db, auth, analytics, remoteConfig };
