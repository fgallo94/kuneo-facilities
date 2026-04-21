'use client';

import type { Incidence, Installation, User } from '@/types';

const URGENCY_LABELS: Record<string, string> = {
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

const URGENCY_COLORS: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-700 border-gray-200',
  high: 'bg-amber-100 text-amber-700 border-amber-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

interface IncidenceCardProps {
  incidence: Incidence;
  installation?: Installation;
  reporter?: User;
  onClick?: () => void;
}

export function IncidenceCard({ incidence, installation, reporter, onClick }: IncidenceCardProps) {
  const urgencyLabel = incidence.severity >= 5 ? 'urgent' : incidence.severity >= 3 ? 'high' : 'normal';
  const location = [installation?.name, installation?.address].filter(Boolean).join(' • ');
  const reporterName = reporter?.displayName || reporter?.email || 'Usuario desconocido';

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md hover:border-gray-300"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${URGENCY_COLORS[urgencyLabel]}`}
        >
          {URGENCY_LABELS[urgencyLabel]}
        </span>
      </div>
      <h4 className="mt-2 text-sm font-semibold text-charcoal line-clamp-2">
        {incidence.title}
      </h4>
      <p className="mt-1 text-xs text-gray-500 line-clamp-1">
        {location || 'Instalación desconocida'}
      </p>
      <p className="mt-2 text-xs text-gray-400">
        {reporterName}
      </p>
    </div>
  );
}
