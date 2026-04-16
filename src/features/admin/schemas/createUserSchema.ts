import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio').max(50),
  lastName: z.string().min(1, 'El apellido es obligatorio').max(50),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'user'], {
    message: 'Selecciona un rol válido',
  }),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
