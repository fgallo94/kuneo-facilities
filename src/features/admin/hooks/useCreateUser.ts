'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getClientFunctions, getClientFirestore } from '@/lib/firebase';

export interface CreateUserPayload {
  email: string;
  password: string;
  displayName: string;
  role: 'admin' | 'user';
  phone?: string;
}

export function useCreateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (payload: CreateUserPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const functions = getClientFunctions();
      const callable = httpsCallable<CreateUserPayload, { uid: string; email: string; displayName: string; role: string }>(
        functions,
        'createUser'
      );
      const result = await callable(payload);
      const { uid, email, displayName, role } = result.data;

      // Crear documento en Firestore para que useAuth y el dashboard lo vean
      const db = getClientFirestore();
      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        displayName,
        role,
        phone: payload.phone || null,
        assignedEntities: [],
        createdAt: serverTimestamp(),
      });

      return result.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear usuario';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { createUser, isLoading, error, clearError };
}
