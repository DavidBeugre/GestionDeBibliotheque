import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "L'email est requis").email('Email invalide'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const passwordRules = z
  .string()
  .min(8, 'Au moins 8 caractères')
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/\d/, 'Au moins un chiffre')
  .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial');

export const resetPasswordSchema = z
  .object({
    newPassword: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
