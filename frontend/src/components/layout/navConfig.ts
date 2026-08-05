import {
  LayoutDashboard,
  BookOpen,
  Users,
  Clock3,
  BookMarked,
  Wallet,
  BarChart3,
  Settings,
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
  { label: 'Livres', path: '/books', icon: BookOpen, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Adhérents', path: '/members', icon: Users, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Emprunts', path: '/borrows', icon: Clock3, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Réservations', path: '/reservations', icon: BookMarked, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Amendes', path: '/fines', icon: Wallet, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Rapports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'LIBRARIAN'] },
  { label: 'Paramètres', path: '/settings', icon: Settings, roles: ['ADMIN'] },
];
