'use client';

import { IncidenceReportForm } from '@/features/incidences/components/IncidenceReportForm';
import type { SubmitIncidenceData } from '@/features/incidences/components/IncidenceReportForm';
import { useCreateIncidence } from '@/features/incidences/hooks/useCreateIncidence';

export default function NewIncidencePage() {
  const { createIncidence, isLoading, error } = useCreateIncidence();

  const handleSubmit = async (data: SubmitIncidenceData) => {
    try {
      await createIncidence(data);
      alert('Reporte enviado correctamente.');
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
      <IncidenceReportForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
