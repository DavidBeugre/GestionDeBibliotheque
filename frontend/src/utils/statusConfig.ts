import type { BadgeProps } from '@/components/ui/badge';

export const BOOK_STATUS_CONFIG: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  ACTIVE: { label: 'Actif', variant: 'success' },
  ARCHIVED: { label: 'Archivé', variant: 'secondary' },
  OUT_OF_PRINT: { label: 'Épuisé', variant: 'outline' },
};

export const COPY_STATUS_CONFIG: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  AVAILABLE: { label: 'Disponible', variant: 'success' },
  BORROWED: { label: 'Emprunté', variant: 'accent' },
  RESERVED: { label: 'Réservé', variant: 'warning' },
  LOST: { label: 'Perdu', variant: 'destructive' },
  DAMAGED: { label: 'Endommagé', variant: 'destructive' },
  MAINTENANCE: { label: 'En maintenance', variant: 'outline' },
  WITHDRAWN: { label: 'Retiré', variant: 'secondary' },
};

export const MEMBER_STATUS_CONFIG: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  ACTIVE: { label: 'Actif', variant: 'success' },
  SUSPENDED: { label: 'Suspendu', variant: 'warning' },
  EXPIRED: { label: 'Expiré', variant: 'secondary' },
  BLOCKED: { label: 'Bloqué', variant: 'destructive' },
};

export const MEMBER_TYPE_LABELS: Record<string, string> = {
  STUDENT: 'Étudiant',
  TEACHER: 'Enseignant',
  STAFF: 'Personnel',
  EXTERNAL: 'Externe',
  VIP: 'VIP',
};

export const BORROW_STATUS_CONFIG: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  ONGOING: { label: 'En cours', variant: 'accent' },
  RETURNED: { label: 'Retourné', variant: 'success' },
  LATE: { label: 'En retard', variant: 'destructive' },
  LOST: { label: 'Perdu', variant: 'destructive' },
  RENEWED: { label: 'Renouvelé', variant: 'accent' },
};

export const FINE_STATUS_CONFIG: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  UNPAID: { label: 'Impayée', variant: 'destructive' },
  PAID: { label: 'Payée', variant: 'success' },
  WAIVED: { label: 'Remise', variant: 'secondary' },
  PARTIALLY_PAID: { label: 'Partiellement payée', variant: 'warning' },
};
