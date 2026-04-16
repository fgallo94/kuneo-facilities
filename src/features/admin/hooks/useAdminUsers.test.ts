import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminUsers } from './useAdminUsers';

const mockGetDocs = vi.fn();

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
    collection: vi.fn(() => 'mocked-collection'),
    query: vi.fn((...args: unknown[]) => args),
    orderBy: vi.fn((...args: unknown[]) => args),
  };
});

vi.mock('@/lib/firebase', () => ({
  getClientFirestore: () => ({}),
}));

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga la lista de usuarios al montar', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'u1', data: () => ({ displayName: 'Alice', email: 'alice@kuneo.app', role: 'admin' }) },
        { id: 'u2', data: () => ({ displayName: 'Bob', email: 'bob@kuneo.app', role: 'user' }) },
      ],
    });

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.users).toHaveLength(2);
    expect(result.current.users[0]).toMatchObject({ uid: 'u1', displayName: 'Alice' });
    expect(result.current.users[1]).toMatchObject({ uid: 'u2', displayName: 'Bob' });
    expect(result.current.error).toBeNull();
  });

  it('refetch actualiza la lista de usuarios', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'u1', data: () => ({ displayName: 'Alice', email: 'alice@kuneo.app', role: 'admin' }) }],
    });

    const { result } = renderHook(() => useAdminUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toHaveLength(1);

    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'u1', data: () => ({ displayName: 'Alice', email: 'alice@kuneo.app', role: 'admin' }) },
        { id: 'u3', data: () => ({ displayName: 'Charlie', email: 'charlie@kuneo.app', role: 'user' }) },
      ],
    });

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toHaveLength(2);
    expect(result.current.users[1]).toMatchObject({ uid: 'u3', displayName: 'Charlie' });
  });

  it('expone el error si getDocs falla', async () => {
    mockGetDocs.mockRejectedValue(new Error('Firestore unavailable'));

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Firestore unavailable');
    expect(result.current.users).toEqual([]);
  });
});
