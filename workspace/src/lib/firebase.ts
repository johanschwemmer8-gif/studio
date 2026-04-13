
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getRemoteConfig, RemoteConfig } from 'firebase/remote-config';
import { getAuth, Auth } from 'firebase/auth';

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

// This pattern prevents re-initialization on hot reloads.
// It's robust for both local development (using .env) and deployed environments
// where Firebase configuration is often auto-injected.
if (!getApps().length) {
    try {
        app = initializeApp(firebaseConfig);
    } catch(e) {
        console.error("Firebase initialization with explicit config failed, trying default. This is expected in a deployed environment.", e);
        // This will work in App Hosting by picking up the injected config
        app = initializeApp({});
    }
} else {
    app = getApp();
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
let analytics: Promise<Analytics | null> | null = null;
let remoteConfig: RemoteConfig | null = null;

if (typeof window !== 'undefined') {
    analytics = (async () => {
        if (await isSupported()) {
            return getAnalytics(app);
        }
        return null;
    })();
    
    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
    remoteConfig.defaultConfig = {
        'in_store_greeting_message': 'Welcome to our store!',
    };
}

export { db, auth, analytics, remoteConfig };
