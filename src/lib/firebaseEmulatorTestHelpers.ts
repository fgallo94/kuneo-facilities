import { initializeApp, deleteApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

let appCounter = 0;

export function getTestApp(): FirebaseApp {
  return initializeApp(
    {
      apiKey: 'demo-api-key',
      authDomain: 'demo-project.firebaseapp.com',
      projectId: 'demo-project',
    },
    `integration-test-app-${appCounter++}`
  );
}

export function getTestEmulatorAuth(app = getTestApp()): Auth {
  const authInstance = getAuth(app);
  connectAuthEmulator(authInstance, 'http://127.0.0.1:9091', { disableWarnings: true });
  return authInstance;
}

export function getTestEmulatorDb(app = getTestApp()): Firestore {
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8081);
  return db;
}

export async function cleanupFirebaseApps(): Promise<void> {
  await Promise.all(getApps().map((app) => deleteApp(app)));
}

export async function clearAuthEmulator(): Promise<void> {
  try {
    await fetch('http://127.0.0.1:9091/emulator/v1/projects/demo-project/accounts', {
      method: 'DELETE',
    });
  } catch {
    // Ignorar si no está corriendo
  }
}

export async function clearFirestoreEmulator(): Promise<void> {
  try {
    await fetch(
      'http://127.0.0.1:8081/emulator/v1/projects/demo-project/databases/(default)/documents',
      { method: 'DELETE' }
    );
  } catch {
    // Ignorar
  }
}

import admin from 'firebase-admin';

export async function setCustomClaims(
  uid: string,
  claims: Record<string, unknown>
): Promise<void> {
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: 'demo-project' });
  }
  await admin.auth().setCustomUserClaims(uid, claims);
}
