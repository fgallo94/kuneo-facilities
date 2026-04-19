'use client';

import { useState } from 'react';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getClientAuth, getClientFirestore } from '@/lib/firebase';

export function useAddComment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addComment = async (incidenceId: string, text: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const auth = getClientAuth();
      const db = getClientFirestore();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error('El comentario no puede estar vacío');
      }

      const authorName = user.displayName || user.email || 'Usuario';

      // 1. Write comment
      const commentRef = doc(collection(db, 'incidences', incidenceId, 'comments'));
      await setDoc(commentRef, {
        authorId: user.uid,
        authorName,
        text: trimmed,
        createdAt: serverTimestamp(),
      });

      // 2. Write history entry
      const historyRef = doc(collection(db, 'incidences', incidenceId, 'history'));
      await setDoc(historyRef, {
        changedBy: user.uid,
        changedByName: authorName,
        changeType: 'comment',
        comment: trimmed,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      let msg = 'Error inesperado al enviar el comentario';
      if (err instanceof Error) {
        msg = err.message;
        if (msg.includes('permission') || msg.includes('Permission')) {
          msg = 'No tienes permisos para comentar. Contacta al administrador.';
        } else if (msg.includes('network') || msg.includes('offline')) {
          msg = 'Error de conexión. Verifica tu red e intenta de nuevo.';
        }
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { addComment, isLoading, error, clearError };
}
