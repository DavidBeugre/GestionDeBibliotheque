import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  Tags,
  Users,
  Clock3,
  BookMarked,
  Wallet,
  BarChart3,
  Settings,
  ScanLine,
  type LucideIcon,
} from 'lucide-react';
import type { RoleName } from '@/types';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Si vide, visible par tous les rôles authentifiés. */
  roles?: RoleName[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', path: '/', icon: LayoutDashboard },
  { label: 'Catalogue', path: '/catalogue', icon: BookOpen, roles: ['READER'] },
  { label: 'Mon historique', path: '/my-history', icon: Clock3, roles: ['READER'] },
  { label: 'Livres', path: '/books', icon: BookOpen, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Auteurs', path: '/authors', icon: PenLine, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Référentiel', path: '/catalog-settings', icon: Tags, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Adhérents', path: '/members', icon: Users, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Emprunts', path: '/borrows', icon: Clock3, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Réservations', path: '/reservations', icon: BookMarked, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Amendes', path: '/fines', icon: Wallet, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Rapports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Scanner', path: '/scanner', icon: ScanLine, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Paramètres', path: '/settings', icon: Settings, roles: ['ADMIN'] },
];
