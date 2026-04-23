/**
 * Test de integración para reglas de Firestore en /incidences/{id}/comments
 * contra Firebase Emulator Suite.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
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

describe('Firestore Rules: Comments (Emulator)', () => {
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

  async function seedIncidence(db: ReturnType<typeof getTestEmulatorDb>, reporterUid: string) {
    const incidenceRef = doc(collection(db, 'incidences'));
    await setDoc(incidenceRef, {
      title: 'Test',
      category: 'plumbing',
      propertyId: 'prop_01',
      installationId: 'inst_01',
      reportedBy: reporterUid,
      description: 'Desc',
      imageUrls: [],
      status: 'Reportada',
      severity: 3,
      billTo: 'Propietario',
      createdAt: serverTimestamp(),
    });
    return incidenceRef.id;
  }

  it('permite crear un comentario con texto', async () => {
    const setupApp = getTestApp();
    const adminAuth = getTestEmulatorAuth(setupApp);
    const adminDb = getTestEmulatorDb(setupApp);

    const adminCredential = await createUserWithEmailAndPassword(adminAuth, 'admin@kuneo.app', 'AdminPass123!');
    await setCustomClaims(adminCredential.user.uid, { role: 'admin' });

    const userAuth = getTestEmulatorAuth();
    const userCredential = await createUserWithEmailAndPassword(userAuth, 'user@kuneo.app', 'TestPass123!');
    const uid = userCredential.user.uid;

    const { getClientAuth, getClientFirestore } = await import('@/lib/firebase');
    const clientAuth = getClientAuth();
    const clientDb = getClientFirestore();
    await signInWithEmailAndPassword(clientAuth, 'user@kuneo.app', 'TestPass123!');

    const incidenceId = await seedIncidence(adminDb, uid);

    const commentRef = doc(collection(clientDb, 'incidences', incidenceId, 'comments'));
    await setDoc(commentRef, {
      authorId: uid,
      text: 'Comentario de prueba',
      createdAt: serverTimestamp(),
    });

    const snap = await getDoc(commentRef);
    expect(snap.exists()).toBe(true);
    expect(snap.data()?.text).toBe('Comentario de prueba');
  });

  it('permite crear un comentario con imagen y sin texto', async () => {
    const setupApp = getTestApp();
    const adminAuth = getTestEmulatorAuth(setupApp);
    const adminDb = getTestEmulatorDb(setupApp);

    const adminCredential = await createUserWithEmailAndPassword(adminAuth, 'admin@kuneo.app', 'AdminPass123!');
    await setCustomClaims(adminCredential.user.uid, { role: 'admin' });

    const userAuth = getTestEmulatorAuth();
    const userCredential = await createUserWithEmailAndPassword(userAuth, 'user@kuneo.app', 'TestPass123!');
    const uid = userCredential.user.uid;

    const { getClientAuth, getClientFirestore } = await import('@/lib/firebase');
    const clientAuth = getClientAuth();
    const clientDb = getClientFirestore();
    await signInWithEmailAndPassword(clientAuth, 'user@kuneo.app', 'TestPass123!');

    const incidenceId = await seedIncidence(adminDb, uid);

    const commentRef = doc(collection(clientDb, 'incidences', incidenceId, 'comments'));
    await setDoc(commentRef, {
      authorId: uid,
      text: '',
      imageUrl: 'https://example.com/photo.jpg',
      imageCaption: 'Leyenda',
      createdAt: serverTimestamp(),
    });

    const snap = await getDoc(commentRef);
    expect(snap.exists()).toBe(true);
    expect(snap.data()?.imageUrl).toBe('https://example.com/photo.jpg');
  });

  it('rechaza un comentario sin texto ni imagen', async () => {
    const setupApp = getTestApp();
    const adminAuth = getTestEmulatorAuth(setupApp);
    const adminDb = getTestEmulatorDb(setupApp);

    const adminCredential = await createUserWithEmailAndPassword(adminAuth, 'admin@kuneo.app', 'AdminPass123!');
    await setCustomClaims(adminCredential.user.uid, { role: 'admin' });

    const userAuth = getTestEmulatorAuth();
    const userCredential = await createUserWithEmailAndPassword(userAuth, 'user@kuneo.app', 'TestPass123!');
    const uid = userCredential.user.uid;

    const { getClientAuth, getClientFirestore } = await import('@/lib/firebase');
    const clientAuth = getClientAuth();
    const clientDb = getClientFirestore();
    await signInWithEmailAndPassword(clientAuth, 'user@kuneo.app', 'TestPass123!');

    const incidenceId = await seedIncidence(adminDb, uid);

    const commentRef = doc(collection(clientDb, 'incidences', incidenceId, 'comments'));
    await expect(
      setDoc(commentRef, {
        authorId: uid,
        text: '',
        createdAt: serverTimestamp(),
      })
    ).rejects.toThrow(/permission/i);
  });

  it('rechaza comentarios de usuarios no autenticados', async () => {
    const setupApp = getTestApp();
    const adminAuth = getTestEmulatorAuth(setupApp);
    const adminDb = getTestEmulatorDb(setupApp);

    const adminCredential = await createUserWithEmailAndPassword(adminAuth, 'admin@kuneo.app', 'AdminPass123!');
    await setCustomClaims(adminCredential.user.uid, { role: 'admin' });

    const incidenceId = await seedIncidence(adminDb, 'some_uid');

    const { getClientFirestore } = await import('@/lib/firebase');
    const clientDb = getClientFirestore();

    const commentRef = doc(collection(clientDb, 'incidences', incidenceId, 'comments'));
    await expect(
      setDoc(commentRef, {
        authorId: 'some_uid',
        text: 'Hola',
        createdAt: serverTimestamp(),
      })
    ).rejects.toThrow(/permission/i);
  });
});
