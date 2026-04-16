/**
 * Test de integración para useAuth contra Firebase Auth Emulator.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  cleanupFirebaseApps,
  clearAuthEmulator,
  getTestEmulatorAuth,
} from '@/lib/firebaseEmulatorTestHelpers';

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

    const { useAuth } = await import('./useAuth');

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('test@kuneo.app', 'TestPass123!', false);
    });

    await waitFor(() => expect(result.current.user).not.toBeNull());
    expect(result.current.user?.email).toBe('test@kuneo.app');
    expect(result.current.error).toBeNull();
  });
});
