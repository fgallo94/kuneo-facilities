import { z } from 'zod';
import { INCIDENCE_CATEGORIES, URGENCY_LEVELS, IncidenceCategory } from '@/types';

export const incidenceSchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(120, 'El título no puede exceder 120 caracteres'),
  category: z.custom<IncidenceCategory>(
    (val) =>
      typeof val === 'string' &&
      INCIDENCE_CATEGORIES.includes(val as IncidenceCategory),
    { message: 'Selecciona una categoría válida' }
  ),
  propertyId: z.string().min(1, 'Selecciona una propiedad'),
  urgency: z.enum(URGENCY_LEVELS, {
    message: 'Selecciona un nivel de urgencia válido',
  }),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),
  photos: z.array(z.instanceof(File)).max(5, 'Máximo 5 fotos permitidas'),
});

export type IncidenceFormData = z.infer<typeof incidenceSchema>;
