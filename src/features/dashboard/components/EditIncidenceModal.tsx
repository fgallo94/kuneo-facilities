'use client';

import { useState } from 'react';
import type { Incidence, IncidenceStatus, Installation, User } from '@/types';
import { INCIDENCE_CATEGORIES, INCIDENCE_STATUSES } from '@/types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface EditIncidenceModalProps {
  incidence: Incidence | null;
  installation?: Installation;
  reporter?: User;
  onClose: () => void;
  onSave: (original: Incidence, payload: Partial<Incidence>) => void;
  isLoading?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: 'Plomería',
  electrical: 'Electricidad',
  carpentry: 'Carpintería',
  hvac: 'Climatización',
  security: 'Seguridad',
  cleaning: 'Limpieza',
  other: 'Otros',
};

export function EditIncidenceModal({
  incidence,
  installation,
  reporter,
  onClose,
  onSave,
  isLoading = false,
}: EditIncidenceModalProps) {
  const [form, setForm] = useState<Partial<Incidence>>({
    title: incidence?.title ?? '',
    description: incidence?.description ?? '',
    category: incidence?.category ?? 'other',
    severity: incidence?.severity ?? 1,
    billTo: incidence?.billTo ?? 'Propietario',
    status: incidence?.status ?? 'Reportada',
  });

  if (!incidence) return null;

  const location = [installation?.name, installation?.address].filter(Boolean).join(' • ');
  const reporterName = reporter?.displayName || reporter?.email || 'Usuario desconocido';

  const currentStatusIndex = INCIDENCE_STATUSES.indexOf(form.status as IncidenceStatus);

  const handlePrevStatus = () => {
    if (currentStatusIndex > 0) {
      setForm((f) => ({ ...f, status: INCIDENCE_STATUSES[currentStatusIndex - 1] }));
    }
  };

  const handleNextStatus = () => {
    if (currentStatusIndex < INCIDENCE_STATUSES.length - 1) {
      setForm((f) => ({ ...f, status: INCIDENCE_STATUSES[currentStatusIndex + 1] }));
    }
  };

  const handleSave = () => {
    onSave(incidence, form);
  };

  const hasChanges =
    form.title !== incidence.title ||
    form.description !== incidence.description ||
    form.category !== incidence.category ||
    form.severity !== incidence.severity ||
    form.billTo !== incidence.billTo ||
    form.status !== incidence.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-charcoal">Editar incidencia</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Título
            </label>
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Descripción
            </label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Categoría
              </label>
              <select
                value={form.category || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as Incidence['category'] }))
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                {INCIDENCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Facturar a
              </label>
              <select
                value={form.billTo || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, billTo: e.target.value as 'Propietario' | 'Explotador' }))
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="Propietario">Propietario</option>
                <option value="Explotador">Explotador</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Severidad (1-5)
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={form.severity || 1}
              onChange={(e) =>
                setForm((f) => ({ ...f, severity: parseInt(e.target.value, 10) }))
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <p><strong>Ubicación:</strong> {location || 'Desconocida'}</p>
            <p><strong>Reportado por:</strong> {reporterName}</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
            <button
              type="button"
              onClick={handlePrevStatus}
              disabled={currentStatusIndex <= 0 || isLoading}
              className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <span className="text-sm font-semibold text-charcoal">
              {form.status}
            </span>
            <button
              type="button"
              onClick={handleNextStatus}
              disabled={currentStatusIndex >= INCIDENCE_STATUSES.length - 1 || isLoading}
              className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="rounded-md bg-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-light disabled:opacity-60"
          >
            {isLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
