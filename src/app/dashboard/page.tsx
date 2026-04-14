'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-600">Bienvenido, {user.email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-sm font-medium text-gray-500">Incidencias activas</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-sm font-medium text-gray-500">Propiedades</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-sm font-medium text-gray-500">Usuarios</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">1</p>
          </div>
        </div>
      </div>
    </div>
  );
}
