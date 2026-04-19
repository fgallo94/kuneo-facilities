'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAdminIncidenceStats } from '@/features/dashboard/hooks/useAdminIncidenceStats';
import { useRecentIncidences } from '@/features/dashboard/hooks/useRecentIncidences';
import { useProperties } from '@/features/incidences/hooks/useProperties';
import { IncidentTrendsChart } from '@/features/dashboard/components/IncidentTrendsChart';
import { RecentIncidentsList } from '@/features/dashboard/components/RecentIncidentsList';
import { FileText, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useIncidenceDetailContext } from '@/features/incidences/context/IncidenceDetailContext';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { openDetail } = useIncidenceDetailContext();
  const isAdmin = user?.role === 'admin';

  const {
    stats,
    chartData,
    loading: statsLoading,
  } = useAdminIncidenceStats({ enabled: isAdmin });

  const {
    incidences: recentIncidences,
    loading: recentLoading,
    error: recentError,
  } = useRecentIncidences(isAdmin ? undefined : user?.uid, 10, !authLoading && !!user);

  const { properties, loading: propertiesLoading } = useProperties();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  const kpiCards = isAdmin
    ? [
        {
          label: 'Total Incidents',
          value: stats.total,
          icon: FileText,
          color: 'text-slate-900',
          bg: 'bg-white',
        },
        {
          label: 'Pending Review',
          value: stats.pendingReview,
          icon: Clock,
          color: 'text-amber-700',
          bg: 'bg-amber-50',
        },
        {
          label: 'In Progress',
          value: stats.inProgress,
          icon: Loader2,
          color: 'text-blue-700',
          bg: 'bg-blue-50',
        },
        {
          label: 'Resolved',
          value: stats.resolved,
          icon: CheckCircle2,
          color: 'text-green-700',
          bg: 'bg-green-50',
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isAdmin ? 'Dashboard Overview' : 'Mis incidencias'}
            </h1>
            <p className="text-sm text-slate-500">
              Bienvenido de nuevo, {user.email}
            </p>
          </div>
        </div>

        {isAdmin && (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpiCards.map((card) => (
                <div
                  key={card.label}
                  className={`rounded-xl border border-slate-200 ${card.bg} p-5 shadow-sm transition hover:shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {card.label}
                      </p>
                      <p className="mt-1 text-3xl font-bold text-slate-900">
                        {statsLoading ? '-' : card.value}
                      </p>
                    </div>
                    <div className={`rounded-lg p-2 ${card.bg} ${card.color}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Incident Trends
                  </h2>
                  <p className="text-xs text-slate-500">
                    Últimos 7 días por nivel de prioridad
                  </p>
                </div>
              </div>
              <div className="mt-4 h-64">
                {statsLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-slate-500">Cargando gráfico...</p>
                  </div>
                ) : (
                  <IncidentTrendsChart data={chartData} />
                )}
              </div>
            </div>
          </>
        )}

        {/* Recent Incidents */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Recent Incidents
          </h2>
          {recentError && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Error al cargar incidencias: {recentError}
            </div>
          )}
          <RecentIncidentsList
            incidences={recentIncidences}
            properties={properties}
            loading={recentLoading || propertiesLoading}
            onSelect={(inc) => openDetail(inc.id)}
          />
        </div>
      </div>
    </div>
  );
}
