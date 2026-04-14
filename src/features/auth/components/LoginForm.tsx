'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Mail, Lock, ArrowRight } from 'lucide-react';
import { loginSchema, type LoginSchema } from '../schemas/loginSchema';

interface LoginFormProps {
  onSubmit: (data: LoginSchema) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="bg-blue-900 text-white p-2 rounded-md">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-blue-900">Kuneo Facilities</h1>
        </div>
        <p className="text-sm font-medium text-gray-500 tracking-wide">COMMAND CENTER LOGIN</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Bienvenido de nuevo</h2>
        <p className="text-sm text-gray-500 mb-6">
          Ingresa tus credenciales para acceder a tus propiedades.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nombre@empresa.com"
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                {...register('email')}
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                {...register('password')}
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
              {...register('remember')}
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
              Recordar por 30 días.
            </label>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Ingresando...' : 'Ingresar al portal'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={() => alert('Función no disponible. Contacta al administrador.')}
        className="mt-4 flex w-full max-w-md items-center justify-center gap-2 rounded-md bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
      >
        <div className="bg-gray-700 text-white p-0.5 rounded-sm">
          <Lock className="h-3 w-3" />
        </div>
        ¿Olvidó su contraseña?
      </button>
    </div>
  );
}
