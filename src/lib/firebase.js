import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForLocalDevelopment12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lifelink-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lifelink-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lifelink-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef1234567890",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEMO123456"
};

let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn("Firebase initialization warning:", e);
}

let authInstance;
try {
  authInstance = app ? getAuth(app) : null;
} catch (e) {
  console.warn("Firebase Auth initialization warning:", e);
  authInstance = null;
}

let dbInstance;
try {
  dbInstance = app ? getFirestore(app) : null;
} catch (e) {
  console.warn("Firestore initialization warning:", e);
  dbInstance = null;
}

let functionsInstance;
try {
  functionsInstance = app ? getFunctions(app) : null;
} catch (e) {
  console.warn("Firebase Functions initialization warning:", e);
  functionsInstance = null;
}

export const auth = authInstance;
export const db = dbInstance;
export const functions = functionsInstance;

export default app;

