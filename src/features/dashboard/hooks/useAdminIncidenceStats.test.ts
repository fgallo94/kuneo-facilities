import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminIncidenceStats } from './useAdminIncidenceStats';

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

describe('useAdminIncidenceStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrderBy.mockImplementation((...args) => ['orderBy', args]);
    mockQuery.mockImplementation((...args) => args);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no ejecuta fetch cuando enabled es false', async () => {
    const { result } = renderHook(() => useAdminIncidenceStats({ enabled: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(result.current.stats.total).toBe(0);
  });

  it('calcula stats y chartData correctamente', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fakeDocs = [
      {
        id: 'inc_1',
        data: () => ({
          title: 'A',
          status: 'Reportada',
          severity: 5,
          createdAt: { seconds: today.getTime() / 1000, nanoseconds: 0 },
        }),
      },
      {
        id: 'inc_2',
        data: () => ({
          title: 'B',
          status: 'En reparación',
          severity: 3,
          createdAt: { seconds: today.getTime() / 1000, nanoseconds: 0 },
        }),
      },
      {
        id: 'inc_3',
        data: () => ({
          title: 'C',
          status: 'Reparado',
          severity: 1,
          createdAt: { seconds: today.getTime() / 1000, nanoseconds: 0 },
        }),
      },
      {
        id: 'inc_4',
        data: () => ({
          title: 'D',
          status: 'Presupuestado',
          severity: 1,
          createdAt: { seconds: today.getTime() / 1000, nanoseconds: 0 },
        }),
      },
    ];

    mockGetDocs.mockResolvedValue({ docs: fakeDocs });

    const { result } = renderHook(() => useAdminIncidenceStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats.total).toBe(4);
    expect(result.current.stats.pendingReview).toBe(1); // Reportada
    expect(result.current.stats.inProgress).toBe(1);
    expect(result.current.stats.resolved).toBe(1);

    const todayIndex = 6;
    expect(result.current.chartData[todayIndex].high).toBe(2); // severity 5 + 3
    expect(result.current.chartData[todayIndex].medium).toBe(2); // severity 1 + 1
  });

  it('maneja errores de firestore', async () => {
    mockGetDocs.mockRejectedValue(new Error('permission-denied'));

    const { result } = renderHook(() => useAdminIncidenceStats());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('permission-denied');
  });
});
