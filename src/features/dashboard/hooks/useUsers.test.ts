import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUsers } from './useUsers';

const mockOnSnapshot = vi.fn();
const mockOrderBy = vi.fn();
const mockQuery = vi.fn();
const mockCollection = vi.fn();

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: (...args: unknown[]) => mockCollection(...args),
    query: (...args: unknown[]) => mockQuery(...args),
    orderBy: (...args: unknown[]) => mockOrderBy(...args),
    onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  };
});

vi.mock('@/lib/firebase', () => ({
  getClientFirestore: () => ({}),
}));

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockImplementation((...args) => args);
    mockOrderBy.mockImplementation((...args) => args);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve la lista de usuarios', async () => {
    const fakeDocs = [
      { id: 'user_1', data: () => ({ email: 'a@test.com', displayName: 'Ana' }) },
      { id: 'user_2', data: () => ({ email: 'b@test.com', displayName: null }) },
    ];

    mockOnSnapshot.mockImplementation((_q, onNext) => {
      onNext({ docs: fakeDocs });
      return () => {};
    });

    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.users).toHaveLength(2);
    expect(result.current.users[0].uid).toBe('user_1');
    expect(result.current.users[1].email).toBe('b@test.com');
    expect(result.current.error).toBeNull();
  });

  it('maneja errores de firestore', async () => {
    mockOnSnapshot.mockImplementation((_q, _onNext, onError) => {
      onError(new Error('permission-denied'));
      return () => {};
    });

    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('permission-denied');
  });
});
