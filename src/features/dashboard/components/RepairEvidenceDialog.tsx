'use client';

import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getClientAuth, getClientStorage } from '@/lib/firebase';
import { PhotoUploader } from '@/features/incidences/components/PhotoUploader';
import type { Incidence } from '@/types';

interface RepairEvidenceDialogProps {
  incidence: Incidence | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    status: 'Reparado';
    repairEvidenceComment?: string;
    repairEvidenceImageUrls?: string[];
  }) => void;
  isLoading?: boolean;
}

export function RepairEvidenceDialog({
  incidence,
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: RepairEvidenceDialogProps) {
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setComment('');
    setPhotos([]);
    setError(null);
    onClose();
  };

  const uploadImages = useCallback(async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    const auth = getClientAuth();
    const storage = getClientStorage();
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const uploadPromises = files.map(async (file, idx) => {
      const path = `incidences/${incidence?.id ?? 'unknown'}/${user.uid}/repair_evidence/${idx}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });
    return Promise.all(uploadPromises);
  }, [incidence?.id]);

  const handleConfirm = async () => {
    if (!incidence) return;
    setUploading(true);
    setError(null);

    try {
      const imageUrls = photos.length > 0 ? await uploadImages(photos) : [];
      onConfirm({
        status: 'Reparado',
        repairEvidenceComment: comment.trim() || undefined,
        repairEvidenceImageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir la evidencia';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  if (!open || !incidence) return null;

  const isProcessing = isLoading || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-0">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Reparación completada
          </h3>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <p className="text-sm text-gray-600">
            Vas a marcar <strong className="text-charcoal">{incidence.title}</strong> como{' '}
            <span className="font-semibold text-amber-700">Reparado</span>. Opcionalmente,
            adjunta evidencia visual y un comentario para el reportador.
          </p>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1">
              Comentario de cierre
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe qué se reparó..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1">
              Fotos de evidencia (opcional)
            </label>
            <PhotoUploader photos={photos} onChange={setPhotos} maxPhotos={5} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-charcoal hover:bg-brand-dark disabled:opacity-50"
          >
            {isProcessing ? 'Guardando...' : 'Confirmar reparación'}
          </button>
        </div>
      </div>
    </div>
  );
}
