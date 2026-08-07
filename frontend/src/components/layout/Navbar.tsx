import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Menu, Search, Bell, Moon, Sun, LogOut, User as UserIcon, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ROLE_LABELS } from '@/constants';
import { notificationService } from '@/services/notification.service';

function initials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function Navbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({ queryKey: ['notifications', 'menu'], queryFn: notificationService.list, refetchInterval: 60000 });
  const unreadCountQuery = useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: notificationService.unreadCount, refetchInterval: 60000 });
  const refreshNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
  const markReadMutation = useMutation({ mutationFn: notificationService.markRead, onSuccess: refreshNotifications });
  const markAllMutation = useMutation({ mutationFn: notificationService.markAllRead, onSuccess: refreshNotifications });

  const handleLogout = async () => {
    await logout();
    toast.success('Vous avez été déconnecté');
    navigate('/login', { replace: true });
  };

  const submitGlobalSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    const search = globalSearch.trim();
    const catalogPath = user?.role === 'READER' ? '/catalogue' : '/books';
    navigate(search ? `${catalogPath}?search=${encodeURIComponent(search)}` : catalogPath);
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Ouvrir la navigation">
        <Menu className="size-5" />
      </Button>

      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher un livre, un auteur ou un ISBN…" className="pl-9" aria-label="Recherche dans le catalogue" value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} onKeyDown={submitGlobalSearch} />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Changer de thème">
          {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
              {(unreadCountQuery.data ?? 0) > 0 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {(unreadCountQuery.data ?? 0) > 0 && <button className="text-xs text-primary hover:underline" onClick={() => markAllMutation.mutate()}>Tout lire</button>}
            </div>
            <DropdownMenuSeparator />
            {notificationsQuery.isLoading ? <p className="px-2 py-4 text-center text-sm text-muted-foreground">Chargement…</p> : (notificationsQuery.data?.items.length ?? 0) === 0 ? <p className="px-2 py-5 text-center text-sm text-muted-foreground">Aucune notification.</p> : notificationsQuery.data!.items.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex cursor-pointer flex-col items-start gap-1 whitespace-normal py-2" onClick={() => { if (!notification.isRead) markReadMutation.mutate(notification.id); if (notification.link) navigate(notification.link); }}>
                <div className="flex w-full items-start justify-between gap-2"><span className="font-medium">{notification.title}</span>{!notification.isRead && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}</div>
                <span className="text-xs text-muted-foreground">{notification.message}</span>
                <span className="text-[11px] text-muted-foreground">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(notification.createdAt))}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-md p-1 pr-2 transition-colors hover:bg-muted">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{initials(user.firstName, user.lastName)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{user.firstName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-xs font-normal text-muted-foreground">{ROLE_LABELS[user.role] ?? user.role}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserIcon className="size-4" /> Mon profil
            </DropdownMenuItem>
            {user.role === 'ADMIN' && <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="size-4" /> Paramètres
            </DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={handleLogout}>
              <LogOut className="size-4" /> Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
