import { z } from 'zod';

export const notificationIncidenceDataSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(120, 'Máximo 120 caracteres'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  reportedBy: z.string().min(1, 'El reportador es obligatorio'),
  urgency: z.enum(['normal', 'high', 'urgent'], {
    message: 'La urgencia debe ser normal, high o urgent',
  }),
  propertyId: z.string().min(1, 'La propiedad es obligatoria'),
  installationId: z.string().min(1, 'La instalación es obligatoria'),
  category: z.string().min(1, 'La categoría es obligatoria'),
  status: z.string().min(1, 'El estado es obligatorio'),
  severity: z.number().int().min(1).max(5, 'La severidad debe estar entre 1 y 5'),
  billTo: z.enum(['Propietario', 'Explotador'], {
    message: 'billTo debe ser Propietario o Explotador',
  }),
  imageUrls: z.array(z.string()).optional(),
  createdAt: z.any().optional(),
  // Campos de conformidad
  conformityStatus: z.enum(['pending', 'accepted', 'rejected']).optional(),
  conformityReason: z.string().optional(),
  conformityComment: z.string().optional(),
  conformityImageUrls: z.array(z.string()).optional(),
});

export type NotificationIncidenceData = z.infer<typeof notificationIncidenceDataSchema>;
