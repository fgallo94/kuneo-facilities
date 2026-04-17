import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUserOpenIncidences } from './useUserOpenIncidences';

const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockCollection = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: (...args: unknown[]) => mockCollection(...args),
    query: (...args: unknown[]) => mockQuery(...args),
    where: (...args: unknown[]) => mockWhere(...args),
    orderBy: (...args: unknown[]) => mockOrderBy(...args),
    limit: (...args: unknown[]) => mockLimit(...args),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
  };
});

const mockGetClientAuth = vi.fn();
const mockGetClientFirestore = vi.fn(() => ({}));

vi.mock('@/lib/firebase', () => ({
  getClientAuth: () => mockGetClientAuth(),
  getClientFirestore: () => mockGetClientFirestore(),
}));

describe('useUserOpenIncidences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClientAuth.mockReturnValue({ currentUser: { uid: 'user_123' } });
    mockWhere.mockImplementation((...args) => ['where', args]);
    mockOrderBy.mockImplementation((...args) => ['orderBy', args]);
    mockLimit.mockImplementation((...args) => ['limit', args]);
    mockQuery.mockImplementation((...args) => args);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns error when user is not authenticated', async () => {
    mockGetClientAuth.mockReturnValue({ currentUser: null });

    const { result } = renderHook(() => useUserOpenIncidences());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Usuario no autenticado');
    expect(result.current.incidences).toEqual([]);
  });

  it('fetches open incidences for the current user', async () => {
    const fakeDocs = [
      {
        id: 'inc_1',
        data: () => ({
          title: 'Fuga',
          status: 'Reportada',
          reportedBy: 'user_123',
          createdAt: { seconds: 1, nanoseconds: 0 },
        }),
      },
      {
        id: 'inc_2',
        data: () => ({
          title: 'Luz',
          status: 'En reparación',
          reportedBy: 'user_123',
          createdAt: { seconds: 2, nanoseconds: 0 },
        }),
      },
    ];

    mockGetDocs.mockResolvedValue({ docs: fakeDocs });

    const { result } = renderHook(() => useUserOpenIncidences(5));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.incidences).toHaveLength(2);
    expect(result.current.incidences[0].title).toBe('Fuga');
    expect(result.current.incidences[1].title).toBe('Luz');
    expect(result.current.error).toBeNull();

    expect(mockWhere).toHaveBeenCalledWith('reportedBy', '==', 'user_123');
    expect(mockWhere).toHaveBeenCalledWith('status', 'in', ['Reportada', 'En reparación', 'A falta de presupuesto', 'Presupuestado', 'Falta de material', 'A facturar']);
    expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  it('handles firestore errors', async () => {
    mockGetDocs.mockRejectedValue(new Error('permission-denied'));

    const { result } = renderHook(() => useUserOpenIncidences());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('permission-denied');
    expect(result.current.incidences).toEqual([]);
  });

  it('refetch refreshes the data', async () => {
    const fakeDocs = [
      { id: 'inc_1', data: () => ({ title: 'Fuga', status: 'Reportada', reportedBy: 'user_123' }) },
    ];
    mockGetDocs.mockResolvedValue({ docs: fakeDocs });

    const { result } = renderHook(() => useUserOpenIncidences());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newDocs = [
      { id: 'inc_1', data: () => ({ title: 'Fuga', status: 'Reportada', reportedBy: 'user_123' }) },
      { id: 'inc_2', data: () => ({ title: 'Luz', status: 'Reportada', reportedBy: 'user_123' }) },
    ];
    mockGetDocs.mockResolvedValue({ docs: newDocs });

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.incidences).toHaveLength(2));
  });
});
