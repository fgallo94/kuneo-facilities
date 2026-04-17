import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  confirmPasswordReset,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getClientAuth, getClientFirestore } from '@/lib/firebase';

export interface AuthUser extends FirebaseUser {
  role?: 'admin' | 'user';
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  sendPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getClientAuth(), async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(getClientFirestore(), 'users', firebaseUser.uid));
        const data = snap.exists() ? snap.data() : null;
        const authUser = firebaseUser as AuthUser;
        if (data?.role === 'admin' || data?.role === 'user') {
          authUser.role = data.role;
        }
        setUser(authUser);
      } catch {
        setUser(firebaseUser as AuthUser);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    setError(null);
    try {
      const persistence = remember ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(getClientAuth(), persistence);
      await signInWithEmailAndPassword(getClientAuth(), email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(translateFirebaseError(message));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await signOut(getClientAuth());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(translateFirebaseError(message));
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const sendPasswordReset = useCallback(async (email: string) => {
    setError(null);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login?mode=resetPassword&email=${encodeURIComponent(email)}`,
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(getClientAuth(), email, actionCodeSettings);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(translateFirebaseError(message));
      throw err;
    }
  }, []);

  const confirmPasswordResetHandler = useCallback(async (oobCode: string, newPassword: string) => {
    setError(null);
    try {
      await confirmPasswordReset(getClientAuth(), oobCode, newPassword);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(translateFirebaseError(message));
      throw err;
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    sendPasswordReset,
    confirmPasswordReset: confirmPasswordResetHandler,
  };
}

function translateFirebaseError(message: string): string {
  if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password') || message.includes('auth/user-not-found')) {
    return 'Correo o contraseña incorrectos';
  }
  if (message.includes('auth/too-many-requests')) {
    return 'Demasiados intentos fallidos. Inténtalo más tarde';
  }
  if (message.includes('auth/invalid-email')) {
    return 'Correo electrónico no válido';
  }
  if (message.includes('auth/weak-password')) {
    return 'La contraseña es demasiado débil';
  }
  if (message.includes('auth/expired-action-code') || message.includes('auth/invalid-action-code')) {
    return 'El enlace ha expirado o no es válido. Solicita uno nuevo';
  }
  return 'Error al iniciar sesión. Inténtalo de nuevo';
}
