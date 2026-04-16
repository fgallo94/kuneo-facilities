import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Debe ser un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  displayName: z.string().min(1, 'El nombre es obligatorio').max(100),
  role: z.enum(['admin', 'user'], {
    message: 'El rol debe ser admin o user',
  }),
});

export type CreateUserPayload = z.infer<typeof createUserSchema>;
