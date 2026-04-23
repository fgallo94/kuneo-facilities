'use client';

import { useState } from 'react';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getClientAuth, getClientFirestore, getClientStorage } from '@/lib/firebase';

export function useAddComment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addComment = async (
    incidenceId: string,
    text: string,
    imageFile?: File,
    imageCaption?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const auth = getClientAuth();
      const db = getClientFirestore();
      const storage = getClientStorage();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const trimmed = text.trim();
      const captionTrimmed = imageCaption?.trim();

      if (!trimmed && !imageFile) {
        throw new Error('El comentario no puede estar vacío');
      }

      const authorName = user.displayName || user.email || 'Usuario';

      let imageUrl: string | undefined;
      if (imageFile) {
        const commentRef = doc(collection(db, 'incidences', incidenceId, 'comments'));
        const path = `incidences/${incidenceId}/${user.uid}/comments/${commentRef.id}/${imageFile.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // 1. Write comment
      const commentRef = doc(collection(db, 'incidences', incidenceId, 'comments'));
      await setDoc(commentRef, {
        authorId: user.uid,
        authorName,
        text: trimmed || '',
        ...(imageUrl && { imageUrl }),
        ...(captionTrimmed && { imageCaption: captionTrimmed }),
        createdAt: serverTimestamp(),
      });

      // 2. Write history entry
      const historyRef = doc(collection(db, 'incidences', incidenceId, 'history'));
      const historyPayload: Record<string, unknown> = {
        changedBy: user.uid,
        changedByName: authorName,
        changeType: 'comment',
        comment: trimmed || '',
        timestamp: serverTimestamp(),
      };
      if (imageUrl) {
        historyPayload.hasImage = true;
      }
      await setDoc(historyRef, historyPayload);
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
