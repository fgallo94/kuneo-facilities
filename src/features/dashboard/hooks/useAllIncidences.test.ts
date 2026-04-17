import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAllIncidences } from './useAllIncidences';

const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockCollection = vi.fn();
const mockOrderBy = vi.fn();

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: (...args: unknown[]) => mockCollection(...args),
    query: (...args: unknown[]) => mockQuery(...args),
    orderBy: (...args: unknown[]) => mockOrderBy(...args),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
  };
});

vi.mock('@/lib/firebase', () => ({
  getClientFirestore: () => ({}),
}));

describe('useAllIncidences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrderBy.mockImplementation((...args) => ['orderBy', args]);
    mockQuery.mockImplementation((...args) => args);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve todas las incidencias ordenadas', async () => {
    const fakeDocs = [
      { id: 'inc_1', data: () => ({ title: 'Fuga', status: 'Reportada' }) },
      { id: 'inc_2', data: () => ({ title: 'Luz', status: 'En reparación' }) },
    ];
    mockGetDocs.mockResolvedValue({ docs: fakeDocs });

    const { result } = renderHook(() => useAllIncidences());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.incidences).toHaveLength(2);
    expect(result.current.incidences[0].title).toBe('Fuga');
    expect(result.current.error).toBeNull();
  });

  it('maneja errores de firestore', async () => {
    mockGetDocs.mockRejectedValue(new Error('network-error'));

    const { result } = renderHook(() => useAllIncidences());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('network-error');
  });
});
