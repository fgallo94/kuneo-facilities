import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es obligatorio').email('Correo electrónico no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
  remember: z.boolean(),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es obligatorio').email('Correo electrónico no válido'),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
