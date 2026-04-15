'use client';

import { useState } from 'react';
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getClientAuth, getClientFirestore, getClientStorage } from '@/lib/firebase';
import type { IncidenceFormData } from '@/features/incidences/schemas/incidenceSchema';

interface CreateIncidencePayload extends IncidenceFormData {
  installationId: string;
}

function translateError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Error inesperado al crear la incidencia';
}

export function useCreateIncidence() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createIncidence = async (payload: CreateIncidencePayload) => {
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

      const incidenceRef = doc(collection(db, 'incidences'));
      const incidenceId = incidenceRef.id;
      const severity =
        payload.urgency === 'urgent' ? 5 : payload.urgency === 'high' ? 3 : 1;

      // 1. Crear documento en Firestore (sin fotos para que exista antes de subir a Storage)
      await setDoc(incidenceRef, {
        title: payload.title,
        category: payload.category,
        propertyId: payload.propertyId,
        installationId: payload.installationId,
        reportedBy: user.uid,
        description: payload.description,
        imageUrls: [],
        status: 'Backlog',
        severity,
        billTo: 'Propietario',
        createdAt: serverTimestamp(),
      });

      // 2. Subir fotos a Storage (ruta incluye el uid para que las reglas lo validen sin firestore.get)
      const uploadPromises =
        payload.photos.length > 0
          ? payload.photos.map(async (file, idx) => {
              const path = `incidences/${incidenceId}/${user.uid}/photos/${idx}_${file.name}`;
              const storageRef = ref(storage, path);
              await uploadBytes(storageRef, file);
              return getDownloadURL(storageRef);
            })
          : [];
      const imageUrls = await Promise.all(uploadPromises);

      // 3. Actualizar el documento con las URLs de las fotos
      if (imageUrls.length > 0) {
        await updateDoc(incidenceRef, { imageUrls });
      }

      // 4. Registrar entrada inicial en history
      const historyRef = doc(collection(db, 'incidences', incidenceId, 'history'));
      await setDoc(historyRef, {
        changedBy: user.uid,
        oldStatus: 'N/A',
        newStatus: 'Backlog',
        timestamp: serverTimestamp(),
      });

      return incidenceId;
    } catch (err) {
      const msg = translateError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { createIncidence, isLoading, error, clearError };
}
