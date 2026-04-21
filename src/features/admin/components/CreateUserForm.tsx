'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createUserSchema,
  CreateUserFormData,
} from '@/features/admin/schemas/createUserSchema';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { X } from 'lucide-react';

interface CreateUserFormProps {
  onSubmit: (data: CreateUserFormData & { password: string }) => void;
  onClose: () => void;
  isLoading?: boolean;
  serverError?: string | null;
}

export function CreateUserForm({
  onSubmit,
  onClose,
  isLoading = false,
  serverError,
}: CreateUserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'user',
    },
  });

  const handleFormSubmit = (data: CreateUserFormData) => {
    // Generar una contraseña temporal determinista o aleatoria
    const password = `${data.firstName.toLowerCase().replace(/\s/g, '')}123456`;
    onSubmit({ ...data, password });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span className="text-charcoal">+</span> Nuevas Credenciales de Cuenta
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {serverError && (
        <div className="mb-3 rounded bg-red-100 px-3 py-2 text-xs text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              placeholder="p. ej. Elias"
              {...register('firstName')}
              className="mt-1"
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              placeholder="p. ej. Vance"
              {...register('lastName')}
              className="mt-1"
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="elias.vance@empresa.com"
            {...register('email')}
            className="mt-1"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="role">Asignar rol del sistema</Label>
          <Select
            id="role"
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'user', label: 'Usuario' },
            ]}
            {...register('role')}
            className="mt-1"
          />
          {errors.role && (
            <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          fullWidth
        >
          Crear Usuario
        </Button>
      </form>
    </div>
  );
}
