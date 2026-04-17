import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

const mockOnAuthStateChanged = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();
const mockSignOut = vi.fn();
const mockSetPersistence = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
const mockConfirmPasswordReset = vi.fn();

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual<typeof import('firebase/auth')>('firebase/auth');
  return {
    ...actual,
    onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
    signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmailAndPassword(...args),
    signOut: (...args: unknown[]) => mockSignOut(...args),
    setPersistence: (...args: unknown[]) => mockSetPersistence(...args),
    sendPasswordResetEmail: (...args: unknown[]) => mockSendPasswordResetEmail(...args),
    confirmPasswordReset: (...args: unknown[]) => mockConfirmPasswordReset(...args),
    browserLocalPersistence: 'LOCAL',
    browserSessionPersistence: 'SESSION',
    getAuth: vi.fn(() => ({} as never)),
  };
});

vi.mock('@/lib/firebase', () => ({
  getClientAuth: () => ({}),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return vi.fn();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('inicializa con usuario nulo y loading false después del onAuthStateChanged', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('login llama a setPersistence y signInWithEmailAndPassword', async () => {
    mockSetPersistence.mockResolvedValue(undefined);
    mockSignInWithEmailAndPassword.mockResolvedValue({ user: { uid: '123', email: 'test@test.com' } });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('test@test.com', 'password123', true);
    });

    expect(mockSetPersistence).toHaveBeenCalledWith(expect.anything(), 'LOCAL');
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@test.com',
      'password123'
    );
    expect(result.current.error).toBeNull();
  });

  it('login con remember=false usa session persistence', async () => {
    mockSetPersistence.mockResolvedValue(undefined);
    mockSignInWithEmailAndPassword.mockResolvedValue({ user: { uid: '123' } });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('test@test.com', 'password123', false);
    });

    expect(mockSetPersistence).toHaveBeenCalledWith(expect.anything(), 'SESSION');
  });

  it('login maneja errores de firebase', async () => {
    mockSetPersistence.mockResolvedValue(undefined);
    mockSignInWithEmailAndPassword.mockRejectedValue(new Error('auth/invalid-credential'));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      try {
        await result.current.login('test@test.com', 'badpass');
      } catch {
        // esperado
      }
    });

    expect(result.current.error).toBe('Correo o contraseña incorrectos');
  });

  it('logout llama a signOut', async () => {
    mockSignOut.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOut).toHaveBeenCalledWith(expect.anything());
  });

  it('clearError limpia el error', async () => {
    mockSetPersistence.mockResolvedValue(undefined);
    mockSignInWithEmailAndPassword.mockRejectedValue(new Error('auth/invalid-credential'));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      try {
        await result.current.login('test@test.com', 'badpass');
      } catch {
        // esperado
      }
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  describe('sendPasswordReset', () => {
    it('envía el correo de restablecimiento con la URL correcta', async () => {
      mockSendPasswordResetEmail.mockResolvedValue(undefined);
      const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue(
        { origin: 'https://kuneo.app' } as Location
      );

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.sendPasswordReset('user@kuneo.app');
      });

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'user@kuneo.app',
        {
          url: 'https://kuneo.app/login?mode=resetPassword&email=user%40kuneo.app',
          handleCodeInApp: false,
        }
      );
      expect(result.current.error).toBeNull();

      locationSpy.mockRestore();
    });

    it('maneja errores al enviar el correo', async () => {
      mockSendPasswordResetEmail.mockRejectedValue(new Error('auth/invalid-email'));
      const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue(
        { origin: 'https://kuneo.app' } as Location
      );

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        try {
          await result.current.sendPasswordReset('bad-email');
        } catch {
          // esperado
        }
      });

      expect(result.current.error).toBe('Correo electrónico no válido');
      locationSpy.mockRestore();
    });
  });

  describe('confirmPasswordReset', () => {
    it('confirma el cambio de contraseña con el código y nueva contraseña', async () => {
      mockConfirmPasswordReset.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.confirmPasswordReset('abc123', 'NewPass123!');
      });

      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
        expect.anything(),
        'abc123',
        'NewPass123!'
      );
      expect(result.current.error).toBeNull();
    });

    it('maneja errores de código expirado o inválido', async () => {
      mockConfirmPasswordReset.mockRejectedValue(new Error('auth/expired-action-code'));

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        try {
          await result.current.confirmPasswordReset('oldcode', 'NewPass123!');
        } catch {
          // esperado
        }
      });

      expect(result.current.error).toBe('El enlace ha expirado o no es válido. Solicita uno nuevo');
    });
  });
});
