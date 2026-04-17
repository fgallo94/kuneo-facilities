import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUpdateIncidence } from './useUpdateIncidence';

const mockUpdateDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockServerTimestamp = vi.fn(() => ({ _seconds: 1, _nanoseconds: 0 }));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    doc: (...args: unknown[]) => mockDoc(...args),
    collection: (...args: unknown[]) => mockCollection(...args),
    serverTimestamp: () => mockServerTimestamp(),
  };
});

const mockGetClientAuth = vi.fn();

vi.mock('@/lib/firebase', () => ({
  getClientAuth: () => mockGetClientAuth(),
  getClientFirestore: () => ({}),
}));

describe('useUpdateIncidence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClientAuth.mockReturnValue({ currentUser: { uid: 'admin_123' } });
    mockDoc.mockReturnValue('docRef');
    mockCollection.mockReturnValue('collectionRef');
    mockUpdateDoc.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);
  });

  it('actualiza el estado y registra history de status', async () => {
    const { result } = renderHook(() => useUpdateIncidence());

    const original = {
      id: 'inc_1',
      title: 'Fuga',
      status: 'Reportada',
      description: 'desc',
      category: 'plumbing',
      propertyId: 'prop_1',
      installationId: 'inst_1',
      reportedBy: 'user_1',
      imageUrls: [],
      severity: 1,
      billTo: 'Propietario',
    } as import('@/types').Incidence;

    await act(async () => {
      await result.current.updateIncidence(original, { status: 'En reparación' });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', { status: 'En reparación' });
    expect(mockSetDoc).toHaveBeenCalledWith('docRef', {
      changedBy: 'admin_123',
      changeType: 'status',
      oldStatus: 'Reportada',
      newStatus: 'En reparación',
      timestamp: expect.anything(),
    });
  });

  it('registra history de campo cuando cambia un campo', async () => {
    const { result } = renderHook(() => useUpdateIncidence());

    const original = {
      id: 'inc_1',
      title: 'Fuga',
      status: 'Reportada',
      description: 'desc vieja',
      category: 'plumbing',
      propertyId: 'prop_1',
      installationId: 'inst_1',
      reportedBy: 'user_1',
      imageUrls: [],
      severity: 1,
      billTo: 'Propietario',
    } as import('@/types').Incidence;

    await act(async () => {
      await result.current.updateIncidence(original, { description: 'desc nueva' });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', { description: 'desc nueva' });
    expect(mockSetDoc).toHaveBeenCalledWith('docRef', {
      changedBy: 'admin_123',
      changeType: 'field',
      field: 'description',
      oldValue: 'desc vieja',
      newValue: 'desc nueva',
      timestamp: expect.anything(),
    });
  });

  it('no hace nada si no hay cambios', async () => {
    const { result } = renderHook(() => useUpdateIncidence());

    const original = {
      id: 'inc_1',
      title: 'Fuga',
      status: 'Reportada',
      description: 'desc',
      category: 'plumbing',
      propertyId: 'prop_1',
      installationId: 'inst_1',
      reportedBy: 'user_1',
      imageUrls: [],
      severity: 1,
      billTo: 'Propietario',
    } as import('@/types').Incidence;

    await act(async () => {
      await result.current.updateIncidence(original, { title: 'Fuga' });
    });

    expect(mockUpdateDoc).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
