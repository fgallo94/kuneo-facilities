import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (typeof window !== 'undefined') {
  const existingDefaultApp = getApps().find((a) => a.name === '[DEFAULT]');
  app = existingDefaultApp ?? initializeApp(firebaseConfig);
  auth = getAuth(app);

  if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL) {
    try {
      connectAuthEmulator(auth, process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL);
    } catch {
      // Ya conectado al emulador
    }
  }
}

export function getClientAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth no está disponible en el servidor');
  }
  return auth;
}

/** Utilidad exclusiva para tests de integración contra el emulador. */
export function createEmulatorAuth(): Auth {
  const emulatorApp = initializeApp(firebaseConfig, 'emulator-app');
  const emulatorAuth = getAuth(emulatorApp);
  connectAuthEmulator(emulatorAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
  return emulatorAuth;
}

export { auth };
