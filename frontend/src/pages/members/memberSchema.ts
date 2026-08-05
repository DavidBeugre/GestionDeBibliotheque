import { z } from 'zod';

export const memberFormSchema = z.object({
  email: z.string().min(1, "L'email est requis").email('Email invalide'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phone: z.string().optional(),
  sex: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  profession: z.string().optional(),
  memberType: z.string().optional(),
  subscriptionExpiry: z.string().optional(),
});

export type MemberFormSchema = z.infer<typeof memberFormSchema>;
