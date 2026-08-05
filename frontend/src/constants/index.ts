export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

/** Clés TanStack Query centralisées pour éviter les chaînes magiques dispersées dans les pages. */
export const queryKeys = {
  me: ['auth', 'me'] as const,
  books: (params?: unknown) => ['books', params] as const,
  book: (id: string) => ['books', id] as const,
  members: (params?: unknown) => ['members', params] as const,
  member: (id: string) => ['members', id] as const,
  memberHistory: (id: string) => ['members', id, 'history'] as const,
  borrows: (params?: unknown) => ['borrows', params] as const,
  reservations: (params?: unknown) => ['reservations', params] as const,
  fines: (params?: unknown) => ['fines', params] as const,
  categories: ['categories'] as const,
  publishers: ['publishers'] as const,
  authors: (params?: unknown) => ['authors', params] as const,
  bookCopies: (bookId: string) => ['books', bookId, 'copies'] as const,
  notifications: (params?: unknown) => ['notifications', params] as const,
  unreadNotificationsCount: ['notifications', 'unread-count'] as const,
  settings: ['settings'] as const,
  auditLogs: (params?: unknown) => ['audit-logs', params] as const,
  recentActivity: ['activity-logs', 'recent'] as const,
  dashboardStats: ['dashboard', 'stats'] as const,
  report: (type: string, params?: unknown) => ['reports', type, params] as const,
};

/** Permissions telles que définies côté backend (voir prisma/seed.ts). */
export const PERMISSIONS = {
  BOOK_CREATE: 'book:create',
  BOOK_READ: 'book:read',
  BOOK_UPDATE: 'book:update',
  BOOK_DELETE: 'book:delete',
  MEMBER_MANAGE: 'member:manage',
  BORROW_MANAGE: 'borrow:manage',
  FINE_MANAGE: 'fine:manage',
  REPORT_VIEW: 'report:view',
  SETTINGS_MANAGE: 'settings:manage',
  USER_MANAGE: 'user:manage',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  LIBRARIAN: 'Bibliothécaire',
  READER: 'Lecteur',
};
