/**
 * Test de integración para useCreateUser contra Firebase Emulator Suite.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getIdToken,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  cleanupFirebaseApps,
  clearAuthEmulator,
  clearFirestoreEmulator,
  getTestApp,
  getTestEmulatorAuth,
  getTestEmulatorDb,
  setCustomClaims,
} from '@/lib/firebaseEmulatorTestHelpers';

describe('useCreateUser Integration (Emulator)', () => {
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

  it('permite a un admin crear un nuevo usuario y persiste el rol en Firestore', async () => {
    const setupApp = getTestApp();
    const adminAuth = getTestEmulatorAuth(setupApp);
    const adminDb = getTestEmulatorDb(setupApp);

    // 1. Crear admin y setear custom claim
    const adminCredential = await createUserWithEmailAndPassword(
      adminAuth,
      'admin@kuneo.app',
      'AdminPass123!'
    );
    await setCustomClaims(adminCredential.user.uid, { role: 'admin' });
    await setDoc(doc(adminDb, 'users', adminCredential.user.uid), {
      email: 'admin@kuneo.app',
      displayName: 'Admin User',
      role: 'admin',
    });

    // 2. Importar lib y hook dinámicamente
    const { getClientAuth, getClientFirestore } = await import('@/lib/firebase');
    const { useCreateUser } = await import('./useCreateUser');
    const clientAuth = getClientAuth();
    const clientDb = getClientFirestore();

    // 3. Loguear admin en el singleton auth y forzar refresh de token
    const adminClientCredential = await signInWithEmailAndPassword(
      clientAuth,
      'admin@kuneo.app',
      'AdminPass123!'
    );
    await getIdToken(adminClientCredential.user, true);

    // 4. Renderizar hook y crear usuario
    const { result } = renderHook(() => useCreateUser());

    await act(async () => {
      await result.current.createUser({
        email: 'newuser@kuneo.app',
        password: 'NewUser123!',
        displayName: 'New User',
        role: 'user',
      });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();

    // 5. Verificar que el nuevo usuario puede autenticarse
    const newUserAuth = getTestEmulatorAuth();
    const newUserCredential = await signInWithEmailAndPassword(
      newUserAuth,
      'newuser@kuneo.app',
      'NewUser123!'
    );
    expect(newUserCredential.user.email).toBe('newuser@kuneo.app');

    // 6. Verificar documento en Firestore
    const userDoc = await getDoc(doc(clientDb, 'users', newUserCredential.user.uid));
    expect(userDoc.exists()).toBe(true);
    const data = userDoc.data();
    expect(data?.email).toBe('newuser@kuneo.app');
    expect(data?.displayName).toBe('New User');
    expect(data?.role).toBe('user');
  });

  it('rechaza la creación si el usuario no es admin', async () => {
    const normalAuth = getTestEmulatorAuth();
    await createUserWithEmailAndPassword(normalAuth, 'user@kuneo.app', 'UserPass123!');

    const { getClientAuth } = await import('@/lib/firebase');
    const { useCreateUser } = await import('./useCreateUser');
    const clientAuth = getClientAuth();

    await signInWithEmailAndPassword(clientAuth, 'user@kuneo.app', 'UserPass123!');

    const { result } = renderHook(() => useCreateUser());

    await act(async () => {
      await expect(
        result.current.createUser({
          email: 'hacker@kuneo.app',
          password: 'Hacker123!',
          displayName: 'Hacker',
          role: 'admin',
        })
      ).rejects.toThrow();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });
});
