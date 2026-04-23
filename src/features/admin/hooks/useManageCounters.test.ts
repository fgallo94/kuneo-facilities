/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useManageCounters } from './useManageCounters';

const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockDoc = vi.fn(() => ({ id: 'doc_mock' })) as any;
const mockCollection = vi.fn() as any;

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: (...args: any[]) => mockCollection(...args),
    doc: (...args: any[]) => mockDoc(...args),
    setDoc: (...args: any[]) => mockSetDoc(...args),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
    serverTimestamp: () => 'MOCK_TIMESTAMP',
  };
});

vi.mock('@/lib/firebase', () => ({
  getClientAuth: () => ({
    currentUser: { uid: 'admin_1', email: 'admin@kuneo.app' },
  }),
  getClientFirestore: () => ({}),
}));

describe('useManageCounters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crea un contador', async () => {
    mockSetDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useManageCounters());

    await act(async () => {
      await result.current.createCounter({ name: 'Contador A', email: 'a@kuneo.app' });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockSetDoc).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('actualiza un contador', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useManageCounters());

    await act(async () => {
      await result.current.updateCounter('counter_1', { name: 'Nuevo nombre' });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockUpdateDoc).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('elimina un contador', async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useManageCounters());

    await act(async () => {
      await result.current.removeCounter('counter_1');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockDeleteDoc).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});
