'use client';

import { useEffect, useState } from 'react';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import type { Incidence, Property } from '@/types';

function getPriorityStyle(severity: number) {
  if (severity >= 5) {
    return {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      label: 'Urgente',
    };
  }
  if (severity >= 3) {
    return {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-200',
      label: 'Alta',
    };
  }
  return {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    label: 'Normal',
  };
}

const STATUS_LABELS: Record<Incidence['status'], string> = {
  Reportada: 'Reportada',
  'En reparación': 'En reparación',
  Reparado: 'Reparado',
  'A falta de presupuesto': 'A falta de presupuesto',
  Presupuestado: 'Presupuestado',
  'Falta de material': 'Falta de material',
  'A facturar': 'A facturar',
};

const CATEGORY_LABELS: Record<Incidence['category'], string> = {
  plumbing: 'Plomería',
  electrical: 'Electricidad',
  carpentry: 'Carpintería',
  hvac: 'Climatización',
  security: 'Seguridad',
  cleaning: 'Limpieza',
  other: 'Otros',
};

const PAGE_SIZE = 5;

interface RecentIncidentsListProps {
  incidences: Incidence[];
  properties: Property[];
  loading?: boolean;
  onSelect?: (incidence: Incidence) => void;
}

export function RecentIncidentsList({
  incidences,
  properties,
  loading = false,
  onSelect,
}: RecentIncidentsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  const totalPages = Math.ceil(incidences.length / PAGE_SIZE);
  const paginatedIncidences = incidences.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [incidences.length]);

  if (loading) {
    return <p className="py-6 text-sm text-slate-500">Cargando incidencias...</p>;
  }

  if (incidences.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-500">No hay incidencias recientes</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {paginatedIncidences.map((inc) => {
        const property = propertyMap.get(inc.propertyId);
        const priorityStyle = getPriorityStyle(inc.severity);
        const statusLabel = STATUS_LABELS[inc.status] ?? inc.status;
        const timeAgo = inc.createdAt ? formatRelativeTime(inc.createdAt) : '';

        return (
          <div
            key={inc.id}
            onClick={() => onSelect?.(inc)}
            className="flex cursor-pointer items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200 hover:bg-slate-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
              <MapPin className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
                >
                  {priorityStyle.label}
                </span>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {inc.title}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {statusLabel}
                {' • '}
                {property?.name ?? 'Propiedad desconocida'}
                {timeAgo ? ` • ${timeAgo}` : ''}
              </p>
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Tipo
              </p>
              <p className="text-sm font-medium text-slate-700">
                {CATEGORY_LABELS[inc.category] ?? inc.category}
              </p>
            </div>
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
          <span className="text-sm text-slate-600">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
