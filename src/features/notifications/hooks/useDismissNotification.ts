'use client';

import { useState, useCallback } from 'react';
import {
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getClientFirestore, getClientAuth } from '@/lib/firebase';

export function useDismissNotification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dismiss = useCallback(async (notificationId: string, userId?: string) => {
    if (!userId) {
      setError('Usuario no autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const auth = getClientAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const db = getClientFirestore();
      const ref = doc(db, 'userNotifications', userId, 'inbox', notificationId);
      await updateDoc(ref, {
        dismissed: true,
        dismissedAt: serverTimestamp(),
        dismissedBy: currentUser.uid,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al descartar';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { dismiss, isLoading, error, clearError };
}
