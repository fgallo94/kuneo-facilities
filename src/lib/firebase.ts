import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function parseHostPort(value: string | undefined): { host: string; port: number } | null {
  if (!value) return null;
  const [host, portStr] = value.split(':');
  const port = parseInt(portStr, 10);
  if (!host || Number.isNaN(port)) return null;
  return { host, port };
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== 'undefined') {
  const existingDefaultApp = getApps().find((a) => a.name === '[DEFAULT]');
  app = existingDefaultApp ?? initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  const authEmulatorUrl = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL;
  if (authEmulatorUrl) {
    try {
      connectAuthEmulator(auth, authEmulatorUrl);
    } catch {
      // Ya conectado al emulador
    }
  }

  const firestoreEmulator = parseHostPort(
    process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST
  );
  if (firestoreEmulator && db) {
    try {
      connectFirestoreEmulator(db, firestoreEmulator.host, firestoreEmulator.port);
    } catch {
      // Ya conectado
    }
  }

  const storageEmulator = parseHostPort(
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST
  );
  if (storageEmulator && storage) {
    try {
      connectStorageEmulator(storage, storageEmulator.host, storageEmulator.port);
    } catch {
      // Ya conectado
    }
  }
}

export function getClientAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth no está disponible en el servidor');
  }
  return auth;
}

export function getClientFirestore(): Firestore {
  if (!db) {
    throw new Error('Firebase Firestore no está disponible en el servidor');
  }
  return db;
}

export function getClientStorage(): FirebaseStorage {
  if (!storage) {
    throw new Error('Firebase Storage no está disponible en el servidor');
  }
  return storage;
}

/** Utilidad exclusiva para tests de integración contra el emulador. */
export function createEmulatorAuth(): Auth {
  const emulatorApp = initializeApp(firebaseConfig, 'emulator-app');
  const emulatorAuth = getAuth(emulatorApp);
  const url = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL ?? 'http://127.0.0.1:9091';
  connectAuthEmulator(emulatorAuth, url, { disableWarnings: true });
  return emulatorAuth;
}

export { auth, db, storage };
