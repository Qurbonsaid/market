import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const FIREBASE_CONFIG_KEY = "market_firebase_config";

export function getStoredFirebaseConfig(): FirebaseConfig | null {
  const saved = localStorage.getItem(FIREBASE_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  // Check env variables
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
    };
  }

  return null;
}

export function saveStoredFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
}

export function clearStoredFirebaseConfig(): void {
  localStorage.removeItem(FIREBASE_CONFIG_KEY);
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirestoreDB(): Firestore | null {
  if (db) return db;

  const config = getStoredFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }

    // Firestore Free Tier optimization: Offline persistence with persistentMultipleTabManager
    // Saves Firestore daily read quota by caching previously queried documents locally!
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

    return db;
  } catch (error) {
    console.warn("Firestore initsializatsiyasida ogohlantirish:", error);
    return null;
  }
}

export function isFirebaseConfigured(): boolean {
  const config = getStoredFirebaseConfig();
  return Boolean(config?.apiKey && config?.projectId);
}
