'use client';

import { useState } from 'react';
import { collection, doc, serverTimestamp, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { Contractor } from '@/types';

export function useManageContractors() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createContractor = async (payload: Omit<Contractor, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getClientFirestore();
      const ref = doc(collection(db, 'contractors'));
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear contratista';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateContractor = async (contractorId: string, payload: Partial<Omit<Contractor, 'id' | 'createdAt'>>) => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getClientFirestore();
      const ref = doc(db, 'contractors', contractorId);
      await updateDoc(ref, payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar contratista';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const removeContractor = async (contractorId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getClientFirestore();
      await deleteDoc(doc(db, 'contractors', contractorId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar contratista';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { createContractor, updateContractor, removeContractor, isLoading, error, clearError };
}
