/**
 * Test de integración para useCreateIncidence contra Firebase Emulator Suite.
 *
 * Requisitos previos:
 * 1. Tener instalado firebase-tools: npm install -g firebase-tools
 * 2. Iniciar emuladores: npx firebase emulators:start --project demo-project
 * 3. Ejecutar el test: npm run test:integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { initializeApp, deleteApp, getApps } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

// Env vars para que @/lib/firebase se conecte a los emuladores
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9091';
const FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';

process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'demo-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'demo-project.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'demo-project.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456:web:abc123';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL = AUTH_EMULATOR_URL;
process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;

let appCounter = 0;

async function cleanupFirebaseApps() {
  await Promise.all(getApps().map((app) => deleteApp(app)));
}

function getTestApp() {
  return initializeApp(
    {
      apiKey: 'demo-api-key',
      authDomain: 'demo-project.firebaseapp.com',
      projectId: 'demo-project',
    },
    `integration-test-app-${appCounter++}`
  );
}

function getTestEmulatorAuth() {
  const authInstance = getAuth(getTestApp());
  connectAuthEmulator(authInstance, AUTH_EMULATOR_URL, { disableWarnings: true });
  return authInstance;
}

function getTestEmulatorDb() {
  const db = getFirestore(getTestApp());
  connectFirestoreEmulator(db, '127.0.0.1', 8081);
  return db;
}

async function clearAuthEmulator() {
  try {
    await fetch('http://127.0.0.1:9091/emulator/v1/projects/demo-project/accounts', {
      method: 'DELETE',
    });
  } catch {
    // Ignorar si no está corriendo
  }
}

async function clearFirestoreEmulator() {
  try {
    await fetch(
      'http://127.0.0.1:8081/emulator/v1/projects/demo-project/databases/(default)/documents',
      { method: 'DELETE' }
    );
  } catch {
    // Ignorar
  }
}

async function setCustomClaims(uid: string, claims: Record<string, unknown>) {
  await fetch(
    'http://127.0.0.1:9091/identitytoolkit.googleapis.com/v1/projects/demo-project/accounts:update',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        localId: uid,
        customAttributes: JSON.stringify(claims),
      }),
    }
  );
}

describe('useCreateIncidence Integration (Emulator)', () => {
  beforeEach(async () => {
    await cleanupFirebaseApps();
    vi.resetModules();
    await clearAuthEmulator();
    await clearFirestoreEmulator();
  });

  afterEach(async () => {
    await cleanupFirebaseApps();
    await clearAuthEmulator();
    await clearFirestoreEmulator();
  });

  it('crea una incidencia con fotos y genera el history', async () => {
    const adminAuth = getTestEmulatorAuth();
    const adminDb = getTestEmulatorDb();

    // 1. Crear admin y setear custom claim
    const adminCredential = await createUserWithEmailAndPassword(
      adminAuth,
      'admin@kuneo.app',
      'AdminPass123!'
    );
    await setCustomClaims(adminCredential.user.uid, { role: 'admin' });

    // 2. Seed installation y property como admin
    const installationId = 'inst_test_01';
    const propertyId = 'prop_test_01';
    await setDoc(doc(collection(adminDb, 'installations'), installationId), {
      groupId: 'group_test',
      name: 'Edificio Test',
    });
    await setDoc(doc(collection(adminDb, 'properties'), propertyId), {
      installationId,
      name: 'Piso Test',
      type: 'Residencial',
    });

    // 3. Crear usuario normal
    const testAuth = getTestEmulatorAuth();
    await createUserWithEmailAndPassword(testAuth, 'user@kuneo.app', 'TestPass123!');

    // 4. Importar hook para que @/lib/firebase use los emuladores
    const { useCreateIncidence } = await import('./useCreateIncidence');
    const { getClientAuth, getClientFirestore } = await import('@/lib/firebase');
    const clientAuth = getClientAuth();
    const clientDb = getClientFirestore();

    // 5. Loguear usuario normal en el singleton auth (usado por el hook)
    await signInWithEmailAndPassword(clientAuth, 'user@kuneo.app', 'TestPass123!');

    // 6. Renderizar hook y crear incidencia
    const { result } = renderHook(() => useCreateIncidence());

    await act(async () => {
      await result.current.createIncidence({
        title: 'Fuga test',
        category: 'plumbing',
        propertyId,
        urgency: 'high',
        description: 'Hay una fuga importante en el baño.',
        photos: [],
        installationId,
      });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();

    // 7. Verificar en Firestore que la incidencia existe
    const qIncidences = query(
      collection(clientDb, 'incidences'),
      where('reportedBy', '==', clientAuth.currentUser!.uid)
    );
    const incidenceSnap = await getDocs(qIncidences);
    expect(incidenceSnap.docs.length).toBe(1);

    const incidenceData = incidenceSnap.docs[0].data();
    expect(incidenceData.title).toBe('Fuga test');
    expect(incidenceData.category).toBe('plumbing');
    expect(incidenceData.propertyId).toBe(propertyId);
    expect(incidenceData.installationId).toBe(installationId);
    expect(incidenceData.reportedBy).toBe(clientAuth.currentUser!.uid);
    expect(incidenceData.status).toBe('Backlog');
    expect(incidenceData.severity).toBe(3);
    expect(incidenceData.billTo).toBe('Propietario');
    expect(incidenceData.imageUrls).toEqual([]);

    // 8. Verificar subcolección history
    const historySnap = await getDocs(
      collection(clientDb, 'incidences', incidenceSnap.docs[0].id, 'history')
    );
    expect(historySnap.docs.length).toBe(1);
    const historyData = historySnap.docs[0].data();
    expect(historyData.newStatus).toBe('Backlog');
    expect(historyData.changedBy).toBe(clientAuth.currentUser!.uid);
  });

  it('rechaza la creación si el usuario no está autenticado', async () => {
    const { useCreateIncidence } = await import('./useCreateIncidence');
    const { result } = renderHook(() => useCreateIncidence());

    await act(async () => {
      await expect(
        result.current.createIncidence({
          title: 'Fuga test',
          category: 'plumbing',
          propertyId: 'prop_01',
          urgency: 'normal',
          description: 'Descripción de prueba.',
          photos: [],
          installationId: 'inst_01',
        })
      ).rejects.toThrow('Usuario no autenticado');
    });
  });
});
