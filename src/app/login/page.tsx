'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { LoginSchema } from '@/features/auth/schemas/loginSchema';

export default function LoginPage() {
  const { user, loading, login, error, clearError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (data: LoginSchema) => {
    clearError();
    try {
      await login(data.email, data.password, data.remember);
    } catch {
      // El error ya se maneja dentro del hook
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return <LoginForm onSubmit={handleSubmit} isLoading={loading} error={error} />;
}
