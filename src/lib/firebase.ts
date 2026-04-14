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

// This is the key logic. We check if all required config values are present.
// If they are, we are likely in a local environment using a .env file.
// If they are NOT, we assume we are in a deployed Firebase environment
// where the config is auto-injected.
const isConfigComplete = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!getApps().length) {
    if (isConfigComplete) {
        // Use the explicit config from .env for local development
        app = initializeApp(firebaseConfig);
    } else {
        // Use Firebase Hosting's auto-injected config for the live app
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
