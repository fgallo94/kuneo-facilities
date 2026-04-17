'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm, type LoginFormMode } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '@/features/auth/schemas/loginSchema';

function LoginPageContent() {
  const { user, loading, login, sendPasswordReset, confirmPasswordReset, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<LoginFormMode>('login');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const urlMode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const urlEmail = searchParams.get('email') ?? '';

  const activeMode: LoginFormMode = (urlMode === 'resetPassword' && oobCode) ? 'reset' : mode;

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmitLogin = async (data: LoginSchema) => {
    clearError();
    try {
      await login(data.email, data.password, data.remember);
    } catch {
      // El error ya se maneja dentro del hook
    }
  };

  const handleSubmitForgot = async (data: ForgotPasswordSchema) => {
    clearError();
    setSuccessMessage(null);
    try {
      await sendPasswordReset(data.email);
      setSuccessMessage('Te hemos enviado un correo con el enlace para recuperar tu acceso.');
    } catch {
      // El error ya se maneja dentro del hook
    }
  };

  const handleSubmitReset = async (data: ResetPasswordSchema) => {
    clearError();
    if (!oobCode) {
      return;
    }
    try {
      await confirmPasswordReset(oobCode, data.password);
      router.replace('/login?resetSuccess=1');
    } catch {
      // El error ya se maneja dentro del hook
    }
  };

  const handleSwitchMode = (newMode: LoginFormMode) => {
    clearError();
    setSuccessMessage(null);
    setMode(newMode);
    if (newMode !== 'reset') {
      router.replace('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <LoginForm
      mode={activeMode}
      onSubmitLogin={handleSubmitLogin}
      onSubmitForgot={handleSubmitForgot}
      onSubmitReset={handleSubmitReset}
      onSwitchMode={handleSwitchMode}
      isLoading={loading}
      error={error}
      defaultEmail={urlEmail}
      successMessage={successMessage}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
