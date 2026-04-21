import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConformityAction } from './useConformityAction';

// Mocks de Firebase
vi.mock('@/lib/firebase', () => ({
  getClientAuth: () => ({
    currentUser: { uid: 'user-1', displayName: 'Test User', email: 'test@test.com' },
  }),
  getClientFirestore: () => ({}),
  getClientStorage: () => ({}),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(() => Promise.resolve()),
  getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/image.jpg')),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  updateDoc: vi.fn(() => Promise.resolve()),
  setDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => new Date()),
}));

import { updateDoc } from 'firebase/firestore';

const mockIncidence = {
  id: 'inc-1',
  title: 'Test Incidence',
  category: 'plumbing' as const,
  propertyId: 'prop-1',
  installationId: 'inst-1',
  reportedBy: 'user-1',
  description: 'Test description',
  imageUrls: [],
  status: 'Reparado' as const,
  severity: 3,
  billTo: 'Propietario' as const,
};

describe('useConformityAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept repair and update status to A facturar', async () => {
    const { result } = renderHook(() => useConformityAction());

    await act(async () => {
      await result.current.acceptRepair(mockIncidence);
    });

    expect(updateDoc).toHaveBeenCalled();
    const updateCall = vi.mocked(updateDoc).mock.calls[0];
    expect(updateCall[1]).toMatchObject({
      status: 'A facturar',
      conformityStatus: 'accepted',
    });
  });

  it('should reject repair with reason, comment and images', async () => {
    const { result } = renderHook(() => useConformityAction());

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.rejectRepair(mockIncidence, {
        reason: 'No se solucionó el problema',
        comment: 'Sigue goteando',
        imageFiles: [file],
      });
    });

    expect(updateDoc).toHaveBeenCalled();
    const updateCall = vi.mocked(updateDoc).mock.calls[0];
    expect(updateCall[1]).toMatchObject({
      status: 'En reparación',
      conformityStatus: 'rejected',
      conformityReason: 'No se solucionó el problema',
      conformityComment: 'Sigue goteando',
      conformityImageUrls: ['https://example.com/image.jpg'],
    });
  });

  it('should reject without images if none provided', async () => {
    const { result } = renderHook(() => useConformityAction());

    await act(async () => {
      await result.current.rejectRepair(mockIncidence, {
        reason: 'Mala calidad',
      });
    });

    const updateCall = vi.mocked(updateDoc).mock.calls[0];
    expect(updateCall[1]).toMatchObject({
      status: 'En reparación',
      conformityStatus: 'rejected',
      conformityReason: 'Mala calidad',
      conformityImageUrls: [],
    });
  });
});
