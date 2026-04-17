'use client';

import { useRouter } from 'next/navigation';
import { IncidenceReportForm } from '@/features/incidences/components/IncidenceReportForm';
import type { SubmitIncidenceData } from '@/features/incidences/components/IncidenceReportForm';
import { useCreateIncidence } from '@/features/incidences/hooks/useCreateIncidence';
import { useUserOpenIncidences } from '@/features/incidences/hooks/useUserOpenIncidences';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function NewIncidencePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { createIncidence, isLoading, error } = useCreateIncidence();
  const { incidences: openIncidences, loading: openIncidencesLoading, error: openIncidencesError } =
    useUserOpenIncidences(10, !authLoading && !!user);

  const handleSubmit = async (data: SubmitIncidenceData) => {
    try {
      await createIncidence(data);
      router.replace('/dashboard');
    } catch {
      // El error ya queda en el estado del hook
    }
  };

  return (
    <div>
      {error && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}
      {openIncidencesError && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            Error al cargar incidencias: {openIncidencesError}
          </div>
        </div>
      )}
      <IncidenceReportForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        openIncidences={openIncidences}
        openIncidencesLoading={openIncidencesLoading}
      />
    </div>
  );
}
