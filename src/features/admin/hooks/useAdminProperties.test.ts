import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminProperties } from './useAdminProperties';

const mockGetDocs = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDoc = vi.fn().mockReturnValue('mocked-doc');
const mockCollection = vi.fn().mockReturnValue('mocked-collection');

const mockServerTimestamp = vi.fn(() => 'timestamp');

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
    doc: (...args: unknown[]) => mockDoc(...args),
    collection: (...args: unknown[]) => mockCollection(...args),
    query: vi.fn((...args: unknown[]) => args),
    orderBy: vi.fn((...args: unknown[]) => args),
    where: vi.fn((...args: unknown[]) => args),
    serverTimestamp: () => mockServerTimestamp(),
  };
});

vi.mock('@/lib/firebase', () => ({
  getClientFirestore: () => ({}),
}));

describe('useAdminProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga la lista de propiedades al montar', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'p1', data: () => ({ name: 'Propiedad 1', installationId: 'i1' }) },
        { id: 'p2', data: () => ({ name: 'Propiedad 2', installationId: 'i1' }) },
      ],
    });

    const { result } = renderHook(() => useAdminProperties());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.properties).toHaveLength(2);
    expect(result.current.properties[0]).toMatchObject({ id: 'p1', name: 'Propiedad 1' });
  });

  it('updateProperty llama a updateDoc y refresca la lista', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{ id: 'p1', data: () => ({ name: 'Propiedad 1', installationId: 'i1' }) }],
    });

    const { result } = renderHook(() => useAdminProperties());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'p1', data: () => ({ name: 'Propiedad Editada', installationId: 'i1' }) }],
    });

    await act(async () => {
      await result.current.updateProperty('p1', { name: 'Propiedad Editada', address: 'Nueva dirección' });
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      'mocked-doc',
      expect.objectContaining({
        name: 'Propiedad Editada',
        address: 'Nueva dirección',
        assignedUserIds: [],
      })
    );
    expect(result.current.properties[0].name).toBe('Propiedad Editada');
  });
});
