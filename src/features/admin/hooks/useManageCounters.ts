'use client';

import { useState } from 'react';
import { collection, doc, serverTimestamp, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { Counter } from '@/types';

export function useManageCounters() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCounter = async (payload: Omit<Counter, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getClientFirestore();
      const ref = doc(collection(db, 'counters'));
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear contador';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCounter = async (counterId: string, payload: Partial<Omit<Counter, 'id' | 'createdAt'>>) => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getClientFirestore();
      const ref = doc(db, 'counters', counterId);
      await updateDoc(ref, payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar contador';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const removeCounter = async (counterId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getClientFirestore();
      await deleteDoc(doc(db, 'counters', counterId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar contador';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { createCounter, updateCounter, removeCounter, isLoading, error, clearError };
}
