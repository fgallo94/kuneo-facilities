'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAllIncidences } from '@/features/dashboard/hooks/useAllIncidences';
import { useInstallations } from '@/features/dashboard/hooks/useInstallations';
import { useUsers } from '@/features/dashboard/hooks/useUsers';
import { useUpdateIncidence } from '@/features/dashboard/hooks/useUpdateIncidence';
import { IncidenceKanbanBoard } from '@/features/dashboard/components/IncidenceKanbanBoard';

export default function IncidencesKanbanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (!authLoading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, isAdmin, router]);

  const { incidences, loading: incidencesLoading } = useAllIncidences();
  const { installations, loading: installationsLoading } = useInstallations();
  const { users, loading: usersLoading } = useUsers();
  const { updateIncidence, isLoading: isUpdating } = useUpdateIncidence();

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  const loading = incidencesLoading || installationsLoading || usersLoading;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Incidencias activas</h1>
          <p className="text-sm text-slate-500">
            Seguimiento de estado en tiempo real en todas las propiedades.
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-slate-500">Cargando tablero...</p>
          </div>
        ) : (
          <IncidenceKanbanBoard
            incidences={incidences}
            installations={installations}
            users={users}
            onUpdate={updateIncidence}
            isUpdating={isUpdating}
          />
        )}
      </div>
    </div>
  );
}
