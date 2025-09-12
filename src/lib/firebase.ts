
'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getRemoteConfig } from 'firebase/remote-config';

// In a real application, these values would be populated, likely from environment variables.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id",
};

// Check if the config has been populated
const isConfigValid = firebaseConfig.projectId && firebaseConfig.projectId !== 'your-project-id';

// Initialize Firebase
let app: FirebaseApp;
if (isConfigValid && !getApps().length) {
  app = initializeApp(firebaseConfig);
} else if (isConfigValid) {
  app = getApps()[0];
}

// @ts-ignore
const db = isConfigValid ? getFirestore(app) : null;

// Initialize Analytics and Remote Config only on the client side and if the config is valid
const analytics = isConfigValid && typeof window !== 'undefined' && isAnalyticsSupported() 
  // @ts-ignore
  ? getAnalytics(app) 
  : null;
  
const remoteConfig = isConfigValid && typeof window !== 'undefined' 
  // @ts-ignore
  ? getRemoteConfig(app) 
  : null;

if (remoteConfig) {
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
    remoteConfig.defaultConfig = {
        'in_store_greeting_message': 'Welcome to our store!',
    };
}


export { db, analytics, remoteConfig };
