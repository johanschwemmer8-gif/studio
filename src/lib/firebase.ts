
'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getRemoteConfig } from 'firebase/remote-config';

// In a real application, these values would be populated, likely from environment variables.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if the config has been populated
const isConfigValid = firebaseConfig.projectId;

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
