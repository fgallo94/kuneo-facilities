/**
 * Test de integración para useAuth contra Firebase Auth Emulator.
 *
 * Requisitos previos:
 * 1. Tener instalado firebase-tools: npm install -g firebase-tools
 * 2. Iniciar el emulador: npx firebase emulators:start --project demo-project
 * 3. Ejecutar el test: npm run test:integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';

// Configuramos las variables de entorno ANTES de importar dinámicamente useAuth,
// ya que @/lib/firebase se evaluará por primera vez en ese momento.
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9091';

process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'demo-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'demo-project.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'demo-project.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456:web:abc123';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL = AUTH_EMULATOR_URL;

let appCounter = 0;

async function cleanupFirebaseApps() {
  await Promise.all(getApps().map((app) => deleteApp(app)));
}

function getTestEmulatorAuth() {
  const app = initializeApp(
    {
      apiKey: 'demo-api-key',
      authDomain: 'demo-project.firebaseapp.com',
      projectId: 'demo-project',
    },
    `integration-test-app-${appCounter++}`
  );
  const authInstance = getAuth(app);
  connectAuthEmulator(authInstance, AUTH_EMULATOR_URL, { disableWarnings: true });
  return authInstance;
}

async function clearAuthEmulator() {
  try {
    await fetch('http://127.0.0.1:9091/emulator/v1/projects/demo-project/accounts', {
      method: 'DELETE',
    });
  } catch {
    // Ignorar si el emulador no está corriendo
  }
}

describe('useAuth Integration (Auth Emulator)', () => {
  beforeEach(async () => {
    await cleanupFirebaseApps();
    vi.resetModules();
    await clearAuthEmulator();
  });

  afterEach(async () => {
    await cleanupFirebaseApps();
    await clearAuthEmulator();
  });

  it('loguea un usuario creado previamente en el emulador', async () => {
    const testAuth = getTestEmulatorAuth();
    await createUserWithEmailAndPassword(testAuth, 'test@kuneo.app', 'TestPass123!');

    // Import dinámico para que @/lib/firebase se evalúe con las env vars ya seteadas
    const { useAuth } = await import('./useAuth');

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('test@kuneo.app', 'TestPass123!', false);
    });

    expect(result.current.user?.email).toBe('test@kuneo.app');
    expect(result.current.error).toBeNull();
  });
});
