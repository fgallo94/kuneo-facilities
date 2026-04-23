'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { User } from '@/types';

export function useUpdateUserProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (uid: string, data: Partial<Omit<User, 'uid'>>) => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getClientFirestore();
      await updateDoc(doc(db, 'users', uid), data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar perfil';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { updateProfile, isLoading, error, clearError };
}
