import { z } from 'zod';

export const bookFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  subtitle: z.string().optional(),
  isbn: z.string().optional(),
  summary: z.string().optional(),
  categoryId: z.string().optional(),
  publisherId: z.string().optional(),
  authorIds: z.array(z.string()).optional(),
  year: z.coerce.number().int().min(0).max(new Date().getFullYear()).optional(),
  language: z.string().optional(),
  callNumber: z.string().optional(),
  location: z.string().optional(),
  pageCount: z.coerce.number().int().positive().optional(),
  digitalFileUrl: z.string().url('Lien invalide').optional().or(z.literal('')),
  externalLink: z.string().url('Lien invalide').optional().or(z.literal('')),
});

export type BookFormSchema = z.infer<typeof bookFormSchema>;
