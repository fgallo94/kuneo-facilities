'use client';

import { useState } from 'react';
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getClientAuth, getClientFirestore } from '@/lib/firebase';
import type { Incidence, IncidenceHistory, IncidenceStatus } from '@/types';

export interface IncidenceUpdatePayload {
  title?: string;
  description?: string;
  category?: Incidence['category'];
  severity?: number;
  status?: IncidenceStatus;
  billTo?: 'Propietario' | 'Explotador';
}

export function useUpdateIncidence() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateIncidence = async (
    original: Incidence,
    payload: IncidenceUpdatePayload
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const auth = getClientAuth();
      const db = getClientFirestore();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const updateData: Record<string, unknown> = {};
      const historyEntries: Omit<IncidenceHistory, 'id' | 'timestamp'>[] = [];

      // Detect field changes
      (Object.keys(payload) as (keyof IncidenceUpdatePayload)[]).forEach((key) => {
        const newValue = payload[key];
        const oldValue = original[key];
        if (newValue !== undefined && newValue !== oldValue) {
          updateData[key] = newValue;
          if (key === 'status') {
            historyEntries.push({
              changedBy: user.uid,
              changeType: 'status',
              oldStatus: String(oldValue ?? ''),
              newStatus: String(newValue),
            });
          } else {
            historyEntries.push({
              changedBy: user.uid,
              changeType: 'field',
              field: key,
              oldValue: String(oldValue ?? ''),
              newValue: String(newValue),
            });
          }
        }
      });

      if (Object.keys(updateData).length === 0) {
        setIsLoading(false);
        return;
      }

      await updateDoc(doc(db, 'incidences', original.id), updateData);

      // Write history entries
      for (const entry of historyEntries) {
        const historyRef = doc(collection(db, 'incidences', original.id, 'history'));
        await setDoc(historyRef, {
          ...entry,
          timestamp: serverTimestamp(),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { updateIncidence, isLoading, error, clearError };
}
