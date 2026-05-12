import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { clientEnv } from "~/config/env.client";

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase client is browser-only");
  }
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  const config = {
    apiKey: clientEnv.VITE_FIREBASE_API_KEY,
    authDomain: clientEnv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: clientEnv.VITE_FIREBASE_PROJECT_ID,
    storageBucket: clientEnv.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: clientEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: clientEnv.VITE_FIREBASE_APP_ID,
  };
  return initializeApp(config);
}

export function getClientAuth(): Auth {
  return getAuth(getFirebaseApp());
}
