import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInstallations } from './useInstallations';

const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockCollection = vi.fn();

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: (...args: unknown[]) => mockCollection(...args),
    query: (...args: unknown[]) => mockQuery(...args),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
  };
});

vi.mock('@/lib/firebase', () => ({
  getClientFirestore: () => ({}),
}));

describe('useInstallations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockImplementation((...args) => args);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve la lista de instalaciones', async () => {
    const fakeDocs = [
      { id: 'inst_1', data: () => ({ name: 'Edificio A', address: 'Calle 1' }) },
      { id: 'inst_2', data: () => ({ name: 'Edificio B', address: 'Calle 2' }) },
    ];
    mockGetDocs.mockResolvedValue({ docs: fakeDocs });

    const { result } = renderHook(() => useInstallations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.installations).toHaveLength(2);
    expect(result.current.installations[0].name).toBe('Edificio A');
    expect(result.current.error).toBeNull();
  });

  it('maneja errores de firestore', async () => {
    mockGetDocs.mockRejectedValue(new Error('network-error'));

    const { result } = renderHook(() => useInstallations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('network-error');
  });
});
