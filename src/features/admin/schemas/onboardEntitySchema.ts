import { z } from 'zod';

export const onboardEntitySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(120),
  address: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  assignedUserIds: z.array(z.string()),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export type OnboardEntityFormData = z.infer<typeof onboardEntitySchema>;
