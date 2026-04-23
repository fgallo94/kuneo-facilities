'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAllIncidences } from '@/features/dashboard/hooks/useAllIncidences';
import { useGroups } from '@/features/admin/hooks/useGroups';
import { useInstallations } from '@/features/admin/hooks/useInstallations';
import { useProperties } from '@/features/incidences/hooks/useProperties';
import { RecentIncidentsList } from '@/features/dashboard/components/RecentIncidentsList';
import { useIncidenceDetailContext } from '@/features/incidences/context/IncidenceDetailContext';
import { INCIDENCE_STATUSES, INCIDENCE_CATEGORIES } from '@/types';
import type { Incidence } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  Reportada: 'Reportada',
  'En reparación': 'En reparación',
  Reparado: 'Reparado',
  'A falta de presupuesto': 'A falta de presupuesto',
  Presupuestado: 'Presupuestado',
  'Falta de material': 'Falta de material',
  'A facturar': 'A facturar',
};

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: 'Plomería',
  electrical: 'Electricidad',
  carpentry: 'Carpintería',
  hvac: 'Climatización',
  security: 'Seguridad',
  cleaning: 'Limpieza',
  other: 'Otros',
};

function normalizeIncidenceDate(inc: Incidence): Date | null {
  if (!inc.createdAt) return null;
  const ts = inc.createdAt as { toDate?: () => Date; seconds?: number };
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000);
  return null;
}

export function IncidenceDirectory() {
  const { incidences, loading: incidencesLoading } = useAllIncidences();
  const { groups, loading: groupsLoading } = useGroups();
  const [selectedGroup, setSelectedGroup] = useState('');
  const { installations, loading: installationsLoading } = useInstallations(
    selectedGroup || undefined
  );
  const [selectedInstallation, setSelectedInstallation] = useState('');
  const { properties, loading: propertiesLoading } = useProperties();
  const [selectedProperty, setSelectedProperty] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const { openDetail } = useIncidenceDetailContext();

  const installationMap = useMemo(
    () => new Map(installations.map((i) => [i.id, i])),
    [installations]
  );

  const propertyMap = useMemo(
    () => new Map(properties.map((p) => [p.id, p])),
    [properties]
  );

  const filteredProperties = useMemo(() => {
    if (!selectedInstallation) return properties;
    return properties.filter((p) => p.installationId === selectedInstallation);
  }, [properties, selectedInstallation]);

  const filteredIncidences = useMemo(() => {
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(23, 59, 59, 999);

    return incidences.filter((inc) => {
      if (searchTerm && !inc.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      const incDate = normalizeIncidenceDate(inc);
      if (fromDate && incDate && incDate < fromDate) return false;
      if (toDate && incDate && incDate > toDate) return false;

      if (status && inc.status !== status) return false;
      if (category && inc.category !== category) return false;

      if (selectedGroup) {
        const inst = installationMap.get(inc.installationId);
        if (inst?.groupId !== selectedGroup) return false;
      }

      if (selectedInstallation && inc.installationId !== selectedInstallation) return false;
      if (selectedProperty && inc.propertyId !== selectedProperty) return false;

      return true;
    });
  }, [
    incidences,
    searchTerm,
    dateFrom,
    dateTo,
    status,
    category,
    selectedGroup,
    selectedInstallation,
    selectedProperty,
    installationMap,
  ]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setStatus('');
    setCategory('');
    setSelectedGroup('');
    setSelectedInstallation('');
    setSelectedProperty('');
  };

  const filtersActive =
    searchTerm || dateFrom || dateTo || status || category || selectedGroup || selectedInstallation || selectedProperty;

  const loading = incidencesLoading || groupsLoading || installationsLoading || propertiesLoading;

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Directorio de incidencias</h1>
        <p className="text-sm text-gray-500">Filtra y localiza reportes activos e históricos.</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        {/* Row 1: general filters */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Nombre */}
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Nombre
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="h-8 w-full rounded-md border border-gray-300 py-1 pl-7 pr-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {/* Fecha desde */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Fecha hasta */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="">Todos</option>
              {INCIDENCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] ?? s}
                </option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Tipo
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="">Todos</option>
              {INCIDENCE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c] ?? c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: location filters */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {/* Grupo */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Grupo
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setSelectedInstallation('');
                setSelectedProperty('');
              }}
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="">Todos</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Instalación */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Instalación
            </label>
            <select
              value={selectedInstallation}
              onChange={(e) => {
                setSelectedInstallation(e.target.value);
                setSelectedProperty('');
              }}
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="">Todas</option>
              {installations.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          {/* Propiedad */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Propiedad
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="">Todas</option>
              {filteredProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtersActive && (
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-xs text-gray-500">
              {filteredIncidences.length} resultado{filteredIncidences.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <X className="h-3 w-3" />
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <RecentIncidentsList
          incidences={filteredIncidences}
          properties={properties}
          loading={loading}
          onSelect={(inc) => openDetail(inc.id)}
        />
      </div>
    </div>
  );
}
