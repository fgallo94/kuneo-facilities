'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface PhotoUploaderProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  maxPhotos?: number;
  error?: string;
}

export function PhotoUploader({
  photos,
  onChange,
  maxPhotos = 5,
  error,
}: PhotoUploaderProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      );
      const combined = [...photos, ...imageFiles].slice(0, maxPhotos);
      onChange(combined);
    },
    [photos, onChange, maxPhotos]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removePhoto = (index: number) => {
    const next = photos.filter((_, i) => i !== index);
    onChange(next);
  };

  const previews = photos.map((file) => URL.createObjectURL(file));

  return (
    <div className="w-full">
      {isDesktop ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={[
            'rounded-xl border-2 border-dashed bg-gray-50 p-8 text-center transition-colors',
            isDragging
              ? 'border-brand bg-brand/10'
              : 'border-gray-300 hover:border-gray-400',
          ].join(' ')}
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand/15 text-charcoal">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-gray-900">
            Sube fotos de la incidencia
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Arrastra y suelta archivos aquí, o haz clic para seleccionar.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
          >
            Seleccionar archivos
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand/15 text-charcoal">
            <Camera className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-gray-900">
            Capturar evidencia
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Toca para abrir la cámara o seleccionar archivos.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
            >
              Cámara
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Archivos
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previews.map((src, idx) => (
            <div key={src + idx} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Preview ${idx + 1}`}
                className="h-full w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white shadow hover:bg-gray-700"
                aria-label={`Eliminar foto ${idx + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
