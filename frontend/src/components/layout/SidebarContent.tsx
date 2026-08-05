import { NavLink } from 'react-router-dom';
import { Library } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { NAV_ITEMS } from './navConfig';

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();

  const items = NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Library className="size-4" />
        </div>
        <span className="font-display text-sm font-semibold">Bibliothèque</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'card-spine flex items-center gap-3 rounded-md py-2 pl-4 pr-3 text-sm font-medium text-muted-foreground transition-colors',
                'hover:bg-muted hover:text-foreground',
                isActive && 'bg-primary-50 text-primary before:opacity-100',
                !isActive && 'before:opacity-0'
              )
            }
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        Système de Gestion de Bibliothèque · v1.0
      </div>
    </div>
  );
}
