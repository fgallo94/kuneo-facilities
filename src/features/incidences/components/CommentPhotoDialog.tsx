'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PhotoUploader } from './PhotoUploader';

interface CommentPhotoDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (file: File, caption: string) => void;
  isLoading?: boolean;
}

export function CommentPhotoDialog({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: CommentPhotoDialogProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [caption, setCaption] = useState('');

  const handleClose = () => {
    setPhotos([]);
    setCaption('');
    onClose();
  };

  const handleConfirm = () => {
    if (photos.length === 0) return;
    onConfirm(photos[0], caption.trim());
    setPhotos([]);
    setCaption('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-0">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Adjuntar foto al comentario
          </h3>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-charcoal">
              Foto
            </label>
            <PhotoUploader photos={photos} onChange={setPhotos} maxPhotos={1} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-charcoal">
              Descripción / Leyenda
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ej: Vista del grifo desde abajo"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || photos.length === 0}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-charcoal hover:bg-brand-dark disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Adjuntar'}
          </button>
        </div>
      </div>
    </div>
  );
}
