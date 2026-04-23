'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAllIncidences } from '@/features/dashboard/hooks/useAllIncidences';
import { useInstallations } from '@/features/dashboard/hooks/useInstallations';
import { useUsers } from '@/features/dashboard/hooks/useUsers';
import { useUpdateIncidence } from '@/features/dashboard/hooks/useUpdateIncidence';
import { useGroups } from '@/features/admin/hooks/useGroups';
import { useProperties } from '@/features/incidences/hooks/useProperties';
import { IncidenceKanbanBoard } from '@/features/dashboard/components/IncidenceKanbanBoard';

export default function IncidencesKanbanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === 'admin';

  const groupId = searchParams.get('groupId');
  const installationId = searchParams.get('installationId');
  const propertyId = searchParams.get('propertyId');

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
  const { groups, loading: groupsLoading } = useGroups();
  const { properties, loading: propertiesLoading } = useProperties();
  const { users, loading: usersLoading } = useUsers();
  const { updateIncidence, isLoading: isUpdating } = useUpdateIncidence();

  const installationMap = useMemo(
    () => new Map(installations.map((i) => [i.id, i])),
    [installations]
  );

  const groupMap = useMemo(
    () => new Map(groups.map((g) => [g.id, g])),
    [groups]
  );

  const propertyMap = useMemo(
    () => new Map(properties.map((p) => [p.id, p])),
    [properties]
  );

  const filteredIncidences = useMemo(() => {
    return incidences.filter((inc) => {
      // Ocultar incidencias ya facturadas del tablero activo
      if (inc.status === 'Facturada') return false;
      if (groupId) {
        const inst = installationMap.get(inc.installationId);
        if (inst?.groupId !== groupId) return false;
      }
      if (installationId && inc.installationId !== installationId) return false;
      if (propertyId && inc.propertyId !== propertyId) return false;
      return true;
    });
  }, [incidences, groupId, installationId, propertyId, installationMap]);

  const selectedInstallation = installationId
    ? installationMap.get(installationId)
    : undefined;

  const breadcrumbParts = ['Incidencias activas'];
  if (groupId) {
    breadcrumbParts.push(groupMap.get(groupId)?.name ?? groupId);
  }
  if (installationId) {
    breadcrumbParts.push(selectedInstallation?.name ?? installationId);
  }
  if (propertyId) {
    breadcrumbParts.push(propertyMap.get(propertyId)?.name ?? propertyId);
  }

  const breadcrumbTitle = breadcrumbParts.join(' — ');

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  const loading = incidencesLoading || installationsLoading || groupsLoading || propertiesLoading || usersLoading;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{breadcrumbTitle}</h1>
          <p className="text-sm text-gray-500">
            Seguimiento de estado en tiempo real en todas las propiedades.
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-gray-500">Cargando tablero...</p>
          </div>
        ) : (
          <IncidenceKanbanBoard
            incidences={filteredIncidences}
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
