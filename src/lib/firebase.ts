
'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getRemoteConfig } from 'firebase/remote-config';

// In a real application, these values would be populated, likely from environment variables.
const firebaseConfig = {
  "projectId": "interact-aoe-kidkn",
  "appId": "1:783333671853:web:53f7f226c95ac08fbd5724",
  "storageBucket": "interact-aoe-kidkn.firebasestorage.app",
  "apiKey": "AIzaSyAuB__O0Bo4uQLeyZ3UH2wYpbEbcuGevFI",
  "authDomain": "interact-aoe-kidkn.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "783333671853"
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
