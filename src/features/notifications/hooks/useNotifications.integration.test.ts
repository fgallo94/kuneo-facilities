import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { doc, setDoc, collection } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import {
  cleanupFirebaseApps,
  clearAuthEmulator,
  clearFirestoreEmulator,
  getTestApp,
  getTestEmulatorAuth,
  getTestEmulatorDb,
  setCustomClaims,
} from '@/lib/firebaseEmulatorTestHelpers';

describe('useNotifications Integration (Emulator)', () => {
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

  it('recibe notificaciones en tiempo real desde Firestore Emulator', async () => {
    const setupApp = getTestApp();
    const adminAuth = getTestEmulatorAuth(setupApp);
    const adminDb = getTestEmulatorDb(setupApp);

    // 1. Crear usuario admin
    const adminCredential = await createUserWithEmailAndPassword(
      adminAuth,
      'admin@kuneo.app',
      'AdminPass123!'
    );
    const adminUid = adminCredential.user.uid;

    await setCustomClaims(adminUid, { role: 'admin' });
    await signInWithEmailAndPassword(adminAuth, 'admin@kuneo.app', 'AdminPass123!');

    await setDoc(doc(collection(adminDb, 'users'), adminUid), {
      uid: adminUid,
      email: 'admin@kuneo.app',
      displayName: 'Admin Test',
      role: 'admin',
      assignedEntities: [],
    });

    // 2. Importar hook con emuladores activos
    const { useNotifications } = await import('./useNotifications');
    const { getClientAuth } = await import('@/lib/firebase');
    const clientAuth = getClientAuth();

    await signInWithEmailAndPassword(clientAuth, 'admin@kuneo.app', 'AdminPass123!');

    // 3. Renderizar hook (inyectamos adminDb para evitar problemas de caché de módulos en tests)
    const { result } = renderHook(() => useNotifications(adminUid, adminDb));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toHaveLength(0);

    // 4. Crear notificaciones como admin (las rules permiten create a admins)
    await setDoc(
      doc(collection(adminDb, 'userNotifications', adminUid, 'inbox'), 'notif_1'),
      {
        notificationId: 'notif_1',
        type: 'new_incidence',
        title: 'Nueva incidencia: Fuga test',
        message: 'Fuga en baño de prueba',
        incidenceId: 'inc_1',
        urgency: 'urgent',
        read: false,
        dismissed: false,
        createdAt: new Date(),
      }
    );

    // 5. Verificar que el hook recibe la notificación en tiempo real
    await waitFor(() => expect(result.current.notifications).toHaveLength(1));
    expect(result.current.urgentAlerts).toHaveLength(1);
    expect(result.current.urgentAlerts[0].title).toBe('Nueva incidencia: Fuga test');
    expect(result.current.unreadCount).toBe(1);

    // 6. Crear segunda notificación normal
    await setDoc(
      doc(collection(adminDb, 'userNotifications', adminUid, 'inbox'), 'notif_2'),
      {
        notificationId: 'notif_2',
        type: 'new_incidence',
        title: 'Nueva incidencia: Luz test',
        message: 'Luz fallando',
        incidenceId: 'inc_2',
        urgency: 'normal',
        read: false,
        dismissed: false,
        createdAt: new Date(),
      }
    );

    await waitFor(() => expect(result.current.notifications).toHaveLength(2));
    expect(result.current.urgentAlerts).toHaveLength(1);
    expect(result.current.unreadCount).toBe(2);
  });
});
