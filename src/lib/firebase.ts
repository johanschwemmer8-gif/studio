
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

const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

let app: FirebaseApp;
let db: Firestore | null = null;
let auth: Auth | null = null;
let analytics: Promise<Analytics | null> | null = null;
let remoteConfig: RemoteConfig | null = null;

if (isConfigValid) {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    
    db = getFirestore(app);
    auth = getAuth(app);
    
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
} else {
    console.warn("Firebase config is missing or invalid. Firebase services will not be available.");
}

export { db, auth, analytics, remoteConfig };
