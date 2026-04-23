import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAddComment } from './useAddComment';

const mockSetDoc = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockServerTimestamp = vi.fn(() => 'MOCK_TIMESTAMP');
const mockUploadBytes = vi.fn();
const mockGetDownloadURL = vi.fn();
const mockRef = vi.fn();

let currentUser: { uid: string; email: string; displayName: string } | null = {
  uid: 'user_123',
  email: 'test@kuneo.app',
  displayName: 'Test User',
};

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: (...args: unknown[]) => mockCollection(...args),
    doc: (...args: unknown[]) => mockDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    serverTimestamp: () => mockServerTimestamp(),
  };
});

vi.mock('firebase/storage', () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  uploadBytes: (...args: unknown[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: unknown[]) => mockGetDownloadURL(...args),
}));

vi.mock('@/lib/firebase', () => ({
  getClientAuth: () => ({
    get currentUser() {
      return currentUser;
    },
  }),
  getClientFirestore: () => ({}),
  getClientStorage: () => ({}),
}));

describe('useAddComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = {
      uid: 'user_123',
      email: 'test@kuneo.app',
      displayName: 'Test User',
    };
    mockDoc.mockImplementation(() => ({ id: 'doc_mock', path: 'mock/path' }));
  });

  it('envía un comentario de texto sin imagen', async () => {
    const { result } = renderHook(() => useAddComment());

    await result.current.addComment('inc_1', 'Hola mundo');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockSetDoc).toHaveBeenCalledTimes(2); // comment + history
    expect(result.current.error).toBeNull();
  });

  it('envía un comentario con imagen y leyenda', async () => {
    mockUploadBytes.mockResolvedValue(undefined);
    mockGetDownloadURL.mockResolvedValue('https://example.com/photo.jpg');

    const { result } = renderHook(() => useAddComment());
    const file = new File(['blob'], 'photo.png', { type: 'image/png' });

    await result.current.addComment('inc_1', 'Mira esto', file, 'Descripción de la foto');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockRef).toHaveBeenCalled();
    expect(mockUploadBytes).toHaveBeenCalled();
    expect(mockGetDownloadURL).toHaveBeenCalled();
    expect(mockSetDoc).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it('envía solo imagen sin texto', async () => {
    mockUploadBytes.mockResolvedValue(undefined);
    mockGetDownloadURL.mockResolvedValue('https://example.com/photo.jpg');

    const { result } = renderHook(() => useAddComment());
    const file = new File(['blob'], 'photo.png', { type: 'image/png' });

    await result.current.addComment('inc_1', '', file);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockUploadBytes).toHaveBeenCalled();
    expect(mockSetDoc).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it('falla si no hay texto ni imagen', async () => {
    const { result } = renderHook(() => useAddComment());

    await expect(result.current.addComment('inc_1', '')).rejects.toThrow('El comentario no puede estar vacío');

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('El comentario no puede estar vacío');
  });

  it('falla si no hay usuario autenticado', async () => {
    currentUser = null;

    const { result } = renderHook(() => useAddComment());

    await expect(result.current.addComment('inc_1', 'texto')).rejects.toThrow('Usuario no autenticado');

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Usuario no autenticado');
  });
});
