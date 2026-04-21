'use client';

import React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  incidenceSchema,
  IncidenceFormData,
} from '@/features/incidences/schemas/incidenceSchema';
import { INCIDENCE_CATEGORIES, URGENCY_LEVELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PhotoUploader } from './PhotoUploader';
import { useProperties } from '@/features/incidences/hooks/useProperties';
import { ArrowRight, Info, MapPin } from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import type { Incidence } from '@/types';

const categoryOptions = INCIDENCE_CATEGORIES.map((c) => ({
  value: c,
  label:
    c === 'plumbing'
      ? 'Plomería'
      : c === 'electrical'
      ? 'Electricidad'
      : c === 'carpentry'
      ? 'Carpintería'
      : c === 'hvac'
      ? 'Climatización'
      : c === 'security'
      ? 'Seguridad'
      : c === 'cleaning'
      ? 'Limpieza'
      : 'Otros',
}));

const urgencyMeta: Record<
  (typeof URGENCY_LEVELS)[number],
  { label: string; color: string }
> = {
  normal: { label: 'Normal', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  high: { label: 'Alta', color: 'bg-brand/15 text-charcoal border-brand/20' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200' },
};

export interface SubmitIncidenceData extends IncidenceFormData {
  installationId: string;
}

interface IncidenceReportFormProps {
  onSubmit: (data: SubmitIncidenceData) => void;
  isLoading?: boolean;
  openIncidences?: Incidence[];
  openIncidencesLoading?: boolean;
}

export function IncidenceReportForm({
  onSubmit,
  isLoading = false,
  openIncidences = [],
  openIncidencesLoading = false,
}: IncidenceReportFormProps) {
  const { properties, loading: propertiesLoading } = useProperties();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<IncidenceFormData>({
    resolver: zodResolver(incidenceSchema),
    defaultValues: {
      title: '',
      category: undefined,
      propertyId: '',
      urgency: 'normal',
      description: '',
      photos: [],
    },
  });

  const photos = useWatch({ control, name: 'photos' });
  const categoryValue = useWatch({ control, name: 'category' });
  const propertyIdValue = useWatch({ control, name: 'propertyId' });

  const propertyOptions = React.useMemo(
    () =>
      properties.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [properties]
  );


  const handleFormSubmit = (data: IncidenceFormData) => {
    const property = properties.find((p) => p.id === data.propertyId);
    if (!property) {
      return;
    }
    onSubmit({ ...data, installationId: property.installationId });
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <nav className="text-xs text-gray-500">
          <span className="hover:text-gray-700 cursor-pointer">Incidencias</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Nuevo Reporte</span>
        </nav>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
          Reportar Incidencia
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Documenta los problemas con precisión. Nuestro equipo prioriza los reportes según la descripción detallada y la evidencia visual.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="title">Título de la incidencia</Label>
              <Input
                id="title"
                placeholder="Ej: Fuga de agua en cocina"
                {...register('title')}
                className="mt-1.5"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  id="category"
                  options={categoryOptions}
                  placeholder="Selecciona categoría"
                  {...register('category')}
                  value={categoryValue ?? ''}
                  className="mt-1.5"
                />
                {errors.category && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="propertyId">Propiedad</Label>
                <Select
                  id="propertyId"
                  options={propertyOptions}
                  placeholder={
                    propertiesLoading ? 'Cargando...' : 'Selecciona propiedad'
                  }
                  disabled={propertiesLoading}
                  {...register('propertyId')}
                  value={propertyIdValue ?? ''}
                  className="mt-1.5"
                />
                {errors.propertyId && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.propertyId.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Nivel de urgencia</Label>
              <Controller
                name="urgency"
                control={control}
                render={({ field }) => (
                  <div className="mt-1.5 flex gap-2">
                    {URGENCY_LEVELS.map((level) => {
                      const active = field.value === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => field.onChange(level)}
                          className={[
                            'flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors sm:text-sm',
                            active
                              ? urgencyMeta[level].color +
                                ' ring-1 ring-offset-1'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                          ].join(' ')}
                        >
                          {urgencyMeta[level].label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.urgency && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.urgency.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descripción detallada</Label>
              <Textarea
                id="description"
                placeholder="Proporciona todos los detalles posibles para ayudar a nuestro equipo a resolverlo más rápido..."
                {...register('description')}
                className="mt-1.5"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label>Evidencia visual</Label>
              <div className="mt-1.5">
                <PhotoUploader
                  photos={photos}
                  onChange={(files) =>
                    setValue('photos', files, { shouldValidate: true })
                  }
                  error={errors.photos?.message}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="sm:w-auto"
              >
                Enviar Reporte
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isLoading}
                className="sm:w-auto"
              >
                Guardar borrador
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar info */}
        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Info className="h-4 w-4 text-charcoal" />
                Guía de reporte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-charcoal">
                  01
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">La precisión importa</p>
                  <p className="text-xs text-gray-500">
                    Especifica la ubicación exacta y los detalles del problema.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-charcoal">
                  02
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Prueba visual</p>
                  <p className="text-xs text-gray-500">
                    Fotos claras ayudan al equipo de mantenimiento a traer las herramientas correctas.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-charcoal">
                  03
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Tiempo de respuesta</p>
                  <p className="text-xs text-gray-500">
                    La mayoría de reportes se revisan y asignan en menos de 4 horas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-xl bg-orange-100 p-5">
            <h4 className="text-sm font-semibold text-orange-900">¿Emergencia?</h4>
            <p className="mt-1 text-xs text-orange-800">
              En caso de fugas de gas, inundaciones graves o riesgos inmediatos, llama a nuestra línea de emergencia.
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center rounded-lg bg-orange-900 px-3 py-2 text-xs font-medium text-white hover:bg-orange-800"
            >
              1-800-MONOLITH
            </button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-900">
                Tus tickets abiertos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {openIncidencesLoading ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : openIncidences.length === 0 ? (
                <p className="text-sm text-gray-500">No hay incidencias abiertas</p>
              ) : (
                openIncidences.map((inc) => {
                  const isInProgress = inc.status === 'En reparación';
                  return (
                    <div
                      key={inc.id}
                      className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          isInProgress
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-brand/15 text-charcoal'
                        }`}
                      >
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {inc.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {inc.status}
                          {inc.createdAt ? ` • ${formatRelativeTime(inc.createdAt)}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
