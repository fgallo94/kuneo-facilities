'use client';

import { MapPin } from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import type { Incidence, Property } from '@/types';

const STATUS_STYLES: Record<
  Incidence['status'],
  { bg: string; text: string; border: string; label: string }
> = {
  Reportada: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    label: 'Reportada',
  },
  'En reparación': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'En reparación',
  },
  Reparado: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'Reparado',
  },
  'A falta de presupuesto': {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    label: 'A falta de presupuesto',
  },
  Presupuestado: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Presupuestado',
  },
  'Falta de material': {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'Falta de material',
  },
  'A facturar': {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    label: 'A facturar',
  },
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

interface RecentIncidentsListProps {
  incidences: Incidence[];
  properties: Property[];
  loading?: boolean;
}

export function RecentIncidentsList({
  incidences,
  properties,
  loading = false,
}: RecentIncidentsListProps) {
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

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
      {incidences.map((inc) => {
        const property = propertyMap.get(inc.propertyId);
        const statusStyle = STATUS_STYLES[inc.status] ?? {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-200',
          label: inc.status,
        };
        const timeAgo = inc.createdAt ? formatRelativeTime(inc.createdAt) : '';

        return (
          <div
            key={inc.id}
            className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
              <MapPin className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  {statusStyle.label}
                </span>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {inc.title}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
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
    </div>
  );
}
