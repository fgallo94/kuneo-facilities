import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInstallations } from './useInstallations';

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

describe('useInstallations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga la lista de instalaciones al montar', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'i1', data: () => ({ name: 'Instalación 1', groupId: 'g1' }) },
        { id: 'i2', data: () => ({ name: 'Instalación 2', groupId: 'g1' }) },
      ],
    });

    const { result } = renderHook(() => useInstallations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.installations).toHaveLength(2);
    expect(result.current.installations[0]).toMatchObject({ id: 'i1', name: 'Instalación 1' });
  });

  it('updateInstallation llama a updateDoc y refresca la lista', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{ id: 'i1', data: () => ({ name: 'Instalación 1', groupId: 'g1' }) }],
    });

    const { result } = renderHook(() => useInstallations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'i1', data: () => ({ name: 'Instalación Editada', groupId: 'g1' }) }],
    });

    await act(async () => {
      await result.current.updateInstallation('i1', { name: 'Instalación Editada', address: 'Nueva dirección' });
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      'mocked-doc',
      expect.objectContaining({
        name: 'Instalación Editada',
        address: 'Nueva dirección',
        assignedUserIds: [],
      })
    );
    expect(result.current.installations[0].name).toBe('Instalación Editada');
  });
});
