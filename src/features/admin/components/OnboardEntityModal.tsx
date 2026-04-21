'use client';

import React, { useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, MapPin, Building2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { onboardEntitySchema, type OnboardEntityFormData } from '@/features/admin/schemas/onboardEntitySchema';
import { getClientStorage } from '@/lib/firebase';
import type { User } from '@/types';

interface OnboardEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OnboardEntityFormData) => void | Promise<void>;
  users: User[];
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  defaultValues?: Partial<OnboardEntityFormData>;
}

function SingleImageUploader({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const storage = getClientStorage();
      const storageRef = ref(storage, `entities/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onChange(url);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full">
      {!value ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-colors hover:border-brand hover:bg-brand/10"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/15 text-charcoal">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-gray-900">Subir Fotos</p>
          <p className="text-xs text-gray-500">Arrastra y suelta fotos aquí</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {isUploading && <p className="mt-2 text-xs text-charcoal">Subiendo...</p>}
        </div>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-white shadow hover:bg-gray-700"
            aria-label="Eliminar imagen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function UserDropdownSelector({
  users,
  selectedIds,
  onChange,
}: {
  users: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    const values = options.map((o) => o.value);
    onChange(values);
  };

  return (
    <select
      multiple
      value={selectedIds}
      onChange={handleSelect}
      className="mt-1 block h-32 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
    >
      {users.map((user) => (
        <option key={user.uid} value={user.uid}>
          {user.displayName || user.email} ({user.role})
        </option>
      ))}
    </select>
  );
}

export function OnboardEntityModal({
  isOpen,
  onClose,
  onSubmit,
  users,
  title = 'Crear Nueva Propiedad',
  subtitle = 'Administra los detalles, personal asignado y fotos de este recurso.',
  submitLabel = 'Crear Propiedad',
  defaultValues,
}: OnboardEntityModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<OnboardEntityFormData>({
    resolver: zodResolver(onboardEntitySchema),
    defaultValues: {
      name: '',
      address: '',
      description: '',
      assignedUserIds: [],
      imageUrl: '',
      ...defaultValues,
    } as OnboardEntityFormData,
  });

  const handleFormSubmit = async (data: OnboardEntityFormData) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-charcoal">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-5 space-y-4">
          <div>
            <Label className="flex items-center gap-1">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="p. ej., Torre Residencial Apex"
              {...register('name')}
              className="mt-1"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <Label className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-gray-400" />
              Dirección Física
            </Label>
            <Input
              placeholder="Av. Principal 123, Oficina 400..."
              {...register('address')}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-1">
              <Building2 className="h-4 w-4 text-gray-400" />
              Descripción Operacional
            </Label>
            <textarea
              {...register('description')}
              placeholder="Breve resumen de la función principal y parámetros operativos clave..."
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Personal Asignado</Label>
              <p className="text-xs text-gray-500">Añade gestores a este sitio. Mantén presionada la tecla Ctrl (o Cmd) para seleccionar varios.</p>
              <div className="mt-2">
                <Controller
                  name="assignedUserIds"
                  control={control}
                  render={({ field }) => (
                    <UserDropdownSelector users={users.filter((u) => u.role === 'user')} selectedIds={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            <div>
              <Label>Evidencia Visual</Label>
              <div className="mt-2">
                <Controller
                  name="imageUrl"
                  control={control}
                  render={({ field }) => <SingleImageUploader value={field.value} onChange={field.onChange} />}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" size="md" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
