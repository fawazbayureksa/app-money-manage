// Firebase Configuration
// Uses Expo Constants to read from app.json

import Constants from 'expo-constants';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Functions, getFunctions } from 'firebase/functions';
import { FirebaseStorage, getStorage } from 'firebase/storage';

// Firebase configuration from app.json extra
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebase?.apiKey || '',
  authDomain: Constants.expoConfig?.extra?.firebase?.authDomain || '',
  projectId: Constants.expoConfig?.extra?.firebase?.projectId || '',
  storageBucket: Constants.expoConfig?.extra?.firebase?.storageBucket || '',
  messagingSenderId: Constants.expoConfig?.extra?.firebase?.messagingSenderId || '',
  appId: Constants.expoConfig?.extra?.firebase?.appId || '',
};

// Validate configuration
const isFirebaseConfigured = Object.values(firebaseConfig).every(value => value !== '');

if (!isFirebaseConfigured) {
  console.warn('⚠️ Firebase configuration is missing or incomplete. Add Firebase config to app.json');
}

// Initialize Firebase App
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let functions: Functions | undefined;

try {
  if (isFirebaseConfigured) {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Storage
    storage = getStorage(app);
    
    // Initialize Functions
    functions = getFunctions(app);
    
    console.log('✅ Firebase initialized successfully');
  } else {
    console.log('⚠️ Skipping Firebase initialization - configuration missing');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase:', error);
}

// For development: Connect to emulators
if (__DEV__ && isFirebaseConfigured) {
  // Uncomment to use Firebase Emulators during development
  /*
  import { connectAuthEmulator } from 'firebase/auth';
  import { connectFirestoreEmulator } from 'firebase/firestore';
  import { connectFunctionsEmulator } from 'firebase/functions';
  import { connectStorageEmulator } from 'firebase/storage';
  
  if (auth) connectAuthEmulator(auth, 'http://localhost:9099');
  if (db) connectFirestoreEmulator(db, 'localhost', 8080);
  if (functions) connectFunctionsEmulator(functions, 'localhost', 5001);
  if (storage) connectStorageEmulator(storage, 'localhost', 9199);
  
  console.log('🔧 Connected to Firebase Emulators');
  */
}

export { app, auth, db, firebaseConfig, functions, storage };

// Export initialization status
export const isFirebaseReady = isFirebaseConfigured && !!app && !!auth && !!db;
