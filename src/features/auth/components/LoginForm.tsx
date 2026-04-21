'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import {
  loginSchema,
  type LoginSchema,
  forgotPasswordSchema,
  type ForgotPasswordSchema,
  resetPasswordSchema,
  type ResetPasswordSchema,
} from '../schemas/loginSchema';

export type LoginFormMode = 'login' | 'forgot' | 'reset';

export interface LoginFormProps {
  mode?: LoginFormMode;
  onSubmitLogin?: (data: LoginSchema) => Promise<void>;
  onSubmitForgot?: (data: ForgotPasswordSchema) => Promise<void>;
  onSubmitReset?: (data: ResetPasswordSchema) => Promise<void>;
  onSwitchMode?: (mode: LoginFormMode) => void;
  isLoading?: boolean;
  error?: string | null;
  defaultEmail?: string;
  successMessage?: string | null;
}

export function LoginForm({
  mode = 'login',
  onSubmitLogin,
  onSubmitForgot,
  onSubmitReset,
  onSwitchMode,
  isLoading = false,
  error,
  defaultEmail = '',
  successMessage,
}: LoginFormProps) {
  const loginForm = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: '', remember: false },
  });

  const forgotForm = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: defaultEmail },
  });

  const resetForm = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleLoginSubmit = loginForm.handleSubmit(async (data) => {
    await onSubmitLogin?.(data);
  });

  const handleForgotSubmit = forgotForm.handleSubmit(async (data) => {
    await onSubmitForgot?.(data);
  });

  const handleResetSubmit = resetForm.handleSubmit(async (data) => {
    await onSubmitReset?.(data);
  });

  const titles = {
    login: { headline: 'Bienvenido de nuevo', subhead: 'Ingresa tus credenciales para acceder a tus propiedades.' },
    forgot: { headline: 'Recuperar acceso', subhead: 'Ingresa tu correo. Si es tu primera vez, también te servirá para crear tu contraseña.' },
    reset: { headline: 'Nueva contraseña', subhead: 'Ingresa y confirma tu nueva contraseña para continuar.' },
  };

  const currentTitle = titles[mode];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-3">
          <Logo size="lg" />
        </div>
        <p className="text-sm font-medium text-gray-500 tracking-widest uppercase">Portal de Gestión</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">{currentTitle.headline}</h2>
        <p className="text-sm text-gray-500 mb-6">{currentTitle.subhead}</p>

        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
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
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-charcoal placeholder-gray-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  {...loginForm.register('email')}
                />
                <Mail className="absolute right-3 top-1/2 -trangray-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {loginForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">{loginForm.formState.errors.email.message}</p>
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
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-charcoal placeholder-gray-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  {...loginForm.register('password')}
                />
                <Lock className="absolute right-3 top-1/2 -trangray-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {loginForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                {...loginForm.register('remember')}
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
              className="flex w-full items-center justify-center gap-2 rounded-md bg-charcoal px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-charcoal-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Ingresando...' : 'Ingresar al portal'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-5">
            <div className="rounded-md bg-brand/10 p-3 text-sm text-charcoal">
              ¿Es tu primera vez? No te preocupes. Ingresa tu correo y te enviaremos un enlace para que configures tu contraseña.
            </div>

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
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-charcoal placeholder-gray-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  {...forgotForm.register('email')}
                />
                <Mail className="absolute right-3 top-1/2 -trangray-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {forgotForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">{forgotForm.formState.errors.email.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-charcoal px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-charcoal-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Enviando...' : 'Enviar enlace'}
              {!isLoading && <Mail className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => onSwitchMode?.('login')}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-charcoal placeholder-gray-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  {...resetForm.register('password')}
                />
                <KeyRound className="absolute right-3 top-1/2 -trangray-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {resetForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600">{resetForm.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-charcoal placeholder-gray-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  {...resetForm.register('confirmPassword')}
                />
                <Lock className="absolute right-3 top-1/2 -trangray-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {resetForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{resetForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-charcoal px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-charcoal-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Guardando...' : 'Guardar contraseña'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}
      </div>

      {mode === 'login' && (
        <button
          type="button"
          onClick={() => onSwitchMode?.('forgot')}
          className="mt-4 flex w-full max-w-md items-center justify-center gap-2 rounded-md bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
        >
          <div className="bg-charcoal text-white p-0.5 rounded-sm">
            <Lock className="h-3 w-3" />
          </div>
          ¿Olvidó su contraseña?
        </button>
      )}
    </div>
  );
}
