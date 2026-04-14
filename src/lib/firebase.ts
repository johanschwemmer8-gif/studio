
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getRemoteConfig, type RemoteConfig } from 'firebase/remote-config';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';

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

// This pattern prevents re-initialization on hot reloads. It's robust for both
// local development (which uses the .env file) and deployed environments on
// Firebase App Hosting, which auto-injects the configuration.
if (!getApps().length) {
    // If the API key is available as an environment variable, we're likely in a local
    // development environment. Use the config from .env.
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
    } else {
        // Otherwise, we're likely in a deployed Firebase environment.
        // Initialize with an empty object to let Firebase's auto-discovery mechanism work.
        console.log("Firebase config not found in environment variables. Attempting auto-initialization for deployed environment.");
        app = initializeApp({});
    }
} else {
    app = getApp();
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

// Connect to emulators in development mode. This will not affect your live app.
// This check ensures it only runs in the browser and in a development environment.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log("Connecting to Firebase Emulators for local development.");
    // Point auth to the emulator
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    // Point firestore to the emulator
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
}


let analytics: Promise<Analytics | null> | null = null;
let remoteConfig: RemoteConfig | null = null;

if (typeof window !== 'undefined' && app.options?.apiKey) {
    // Conditionally initialize analytics only if a measurementId is present
    if (app.options.measurementId) {
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
