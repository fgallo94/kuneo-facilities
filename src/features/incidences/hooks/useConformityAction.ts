'use client';

import { useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getClientAuth, getClientStorage } from '@/lib/firebase';
import { useUpdateIncidence } from '@/features/dashboard/hooks/useUpdateIncidence';
import type { Incidence } from '@/types';

interface ConformityPayload {
  reason?: string;
  comment?: string;
  imageFiles?: File[];
}

export function useConformityAction() {
  const { updateIncidence, isLoading, error, clearError } = useUpdateIncidence();

  const uploadImages = useCallback(async (incidenceId: string, files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    const auth = getClientAuth();
    const storage = getClientStorage();
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const uploadPromises = files.map(async (file, idx) => {
      const path = `incidences/${incidenceId}/${user.uid}/conformity/${idx}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });
    return Promise.all(uploadPromises);
  }, []);

  const acceptRepair = useCallback(
    async (incidence: Incidence) => {
      await updateIncidence(incidence, {
        status: 'A facturar',
        conformityStatus: 'accepted',
      });
    },
    [updateIncidence]
  );

  const rejectRepair = useCallback(
    async (incidence: Incidence, payload: ConformityPayload) => {
      const imageUrls = payload.imageFiles?.length
        ? await uploadImages(incidence.id, payload.imageFiles)
        : [];

      await updateIncidence(incidence, {
        status: 'En reparación',
        conformityStatus: 'rejected',
        conformityReason: payload.reason,
        conformityComment: payload.comment,
        conformityImageUrls: imageUrls.length > 0 ? imageUrls : [],
      });
    },
    [updateIncidence, uploadImages]
  );

  return {
    acceptRepair,
    rejectRepair,
    isLoading,
    error,
    clearError,
  };
}
