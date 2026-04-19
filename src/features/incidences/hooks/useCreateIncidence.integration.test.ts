/**
 * Test de integración para useCreateIncidence contra Firebase Emulator Suite.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  cleanupFirebaseApps,
  clearAuthEmulator,
  clearFirestoreEmulator,
  getTestApp,
  getTestEmulatorAuth,
  getTestEmulatorDb,
  setCustomClaims,
} from '@/lib/firebaseEmulatorTestHelpers';

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
    // Usar una sola app para setup de auth y db
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
    await signInWithEmailAndPassword(adminAuth, 'admin@kuneo.app', 'AdminPass123!');

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
    const userAuth = getTestEmulatorAuth();
    await createUserWithEmailAndPassword(userAuth, 'user@kuneo.app', 'TestPass123!');

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
    expect(incidenceData.status).toBe('Reportada');
    expect(incidenceData.severity).toBe(3);
    expect(incidenceData.urgency).toBe('high');
    expect(incidenceData.billTo).toBe('Propietario');
    expect(incidenceData.imageUrls).toEqual([]);

    // 8. Verificar subcolección history
    const historySnap = await getDocs(
      collection(clientDb, 'incidences', incidenceSnap.docs[0].id, 'history')
    );
    expect(historySnap.docs.length).toBe(1);
    const historyData = historySnap.docs[0].data();
    expect(historyData.newStatus).toBe('Reportada');
    expect(historyData.changeType).toBe('status');
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
