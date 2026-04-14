import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';

interface UseAuthReturn {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getClientAuth(), (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
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

  return { user, loading, error, login, logout, clearError };
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
  return 'Error al iniciar sesión. Inténtalo de nuevo';
}
