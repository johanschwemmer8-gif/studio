'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getRemoteConfig, type RemoteConfig } from 'firebase/remote-config';
import { getAuth, type Auth } from 'firebase/auth';

// Using the static config you provided to ensure consistency.
const firebaseConfig = {
  apiKey: "AIzaSyBWJOWD2W9O5g2z-NBHZiJiNHJXpyWETXA",
  authDomain: "interact-aoe-kidkn.firebaseapp.com",
  projectId: "interact-aoe-kidkn",
  storageBucket: "interact-aoe-kidkn.firebasestorage.app",
  messagingSenderId: "783333671853",
  appId: "1:783333671853:web:3b524dfe26bf0915bd5724"
  // measurementId is missing, which causes the Analytics error.
};

let app: FirebaseApp;

// This pattern prevents re-initialization on hot reloads.
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
let analytics: Promise<Analytics | null> | null = null;
let remoteConfig: RemoteConfig | null = null;

if (typeof window !== 'undefined') {
    
    // The analytics/config-fetch-failed error is due to missing measurementId.
    // Disabling for now to fix the main login issue.
    if (firebaseConfig.apiKey && (firebaseConfig as any).measurementId) {
        analytics = (async () => {
            if (await isSupported()) {
                return getAnalytics(app);
            }
            return null;
        })();
    }
    
    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
    remoteConfig.defaultConfig = {
        'in_store_greeting_message': 'Welcome to our store!',
    };
}

export { db, auth, analytics, remoteConfig };
