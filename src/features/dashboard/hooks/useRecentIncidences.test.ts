import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRecentIncidences } from './useRecentIncidences';

const mockOnSnapshot = vi.fn();
const mockQuery = vi.fn();
const mockCollection = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: (...args: unknown[]) => mockCollection(...args),
    query: (...args: unknown[]) => mockQuery(...args),
    orderBy: (...args: unknown[]) => mockOrderBy(...args),
    where: (...args: unknown[]) => mockWhere(...args),
    limit: (...args: unknown[]) => mockLimit(...args),
    onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  };
});

vi.mock('@/lib/firebase', () => ({
  getClientFirestore: () => ({}),
}));

describe('useRecentIncidences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrderBy.mockImplementation((...args) => ['orderBy', args]);
    mockWhere.mockImplementation((...args) => ['where', args]);
    mockLimit.mockImplementation((...args) => ['limit', args]);
    mockQuery.mockImplementation((...args) => args);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve incidencias recientes sin filtro de usuario', async () => {
    const fakeDocs = [
      {
        id: 'inc_1',
        data: () => ({ title: 'Fuga', status: 'Reportada', createdAt: { seconds: 1, nanoseconds: 0 } }),
      },
    ];

    mockOnSnapshot.mockImplementation((_q, onNext) => {
      onNext({ docs: fakeDocs });
      return () => {};
    });

    const { result } = renderHook(() => useRecentIncidences(undefined, 5));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.incidences).toHaveLength(1);
    expect(result.current.incidences[0].title).toBe('Fuga');
    expect(mockWhere).not.toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  it('aplica filtro por usuario cuando se proporciona uid', async () => {
    const fakeDocs = [
      {
        id: 'inc_2',
        data: () => ({ title: 'Luz', status: 'En reparación', reportedBy: 'user_123', createdAt: { seconds: 2, nanoseconds: 0 } }),
      },
    ];

    mockOnSnapshot.mockImplementation((_q, onNext) => {
      onNext({ docs: fakeDocs });
      return () => {};
    });

    const { result } = renderHook(() => useRecentIncidences('user_123', 10));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.incidences).toHaveLength(1);
    expect(mockWhere).toHaveBeenCalledWith('reportedBy', '==', 'user_123');
    expect(mockLimit).toHaveBeenCalledWith(10);
  });

  it('maneja errores de firestore', async () => {
    mockOnSnapshot.mockImplementation((_q, _onNext, onError) => {
      onError(new Error('network-error'));
      return () => {};
    });

    const { result } = renderHook(() => useRecentIncidences());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('network-error');
  });

  it('refetch no-op (compatibilidad API)', async () => {
    mockOnSnapshot.mockImplementation((_q, onNext) => {
      onNext({ docs: [] });
      return () => {};
    });

    const { result } = renderHook(() => useRecentIncidences());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // refetch existe pero no hace nada en modo onSnapshot
    expect(() => result.current.refetch()).not.toThrow();
  });
});
