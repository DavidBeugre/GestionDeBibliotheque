import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  BookCopy as BookCopyIcon,
  BookMarked,
  AlertTriangle,
  Users,
  UserPlus,
  Clock3,
  Wallet,
  PackageX,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { MonthlyBorrowsChart } from '@/components/dashboard/MonthlyBorrowsChart';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService } from '@/services/dashboard.service';
import { queryKeys, ROLE_LABELS } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function StaffDashboard() {
  const statsQuery = useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: dashboardService.getStats,
  });

  const activityQuery = useQuery({
    queryKey: queryKeys.recentActivity,
    queryFn: () => dashboardService.getRecentActivity(8),
  });

  const stats = statsQuery.data;

  if (statsQuery.isError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-6 text-sm text-destructive">
          {getApiErrorMessage(statsQuery.error, 'Impossible de charger les statistiques du tableau de bord')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Livres au catalogue" value={stats?.books.total ?? 0} icon={BookOpen} isLoading={statsQuery.isLoading} />
        <StatCard label="Exemplaires disponibles" value={stats?.books.available ?? 0} icon={BookCopyIcon} isLoading={statsQuery.isLoading} />
        <StatCard label="Emprunts en cours" value={stats?.books.borrowed ?? 0} icon={Clock3} accent isLoading={statsQuery.isLoading} />
        <StatCard
          label="Retards"
          value={stats?.circulation.overdueBorrows ?? 0}
          icon={AlertTriangle}
          accent
          isLoading={statsQuery.isLoading}
        />
        <StatCard label="Adhérents actifs" value={stats?.members.active ?? 0} icon={Users} isLoading={statsQuery.isLoading} />
        <StatCard label="Nouveaux ce mois" value={stats?.members.newThisMonth ?? 0} icon={UserPlus} isLoading={statsQuery.isLoading} />
        <StatCard label="Réservations en attente" value={stats?.circulation.pendingReservations ?? 0} icon={BookMarked} isLoading={statsQuery.isLoading} />
        <StatCard label="Exemplaires perdus/endommagés" value={(stats?.books.lost ?? 0) + (stats?.books.damaged ?? 0)} icon={PackageX} isLoading={statsQuery.isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyBorrowsChart data={stats?.monthlyBorrows ?? []} isLoading={statsQuery.isLoading} />
        </div>
        <Card className="card-spine card-spine-accent pl-1">
          <CardContent className="flex h-full flex-col justify-center gap-1 py-6">
            <p className="text-sm text-muted-foreground">Amendes encaissées ce mois-ci</p>
            <p className="font-data text-3xl font-semibold">
              {statsQuery.isLoading ? '—' : `${stats?.finance.collectedThisMonth ?? 0}`}
            </p>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>{stats?.catalogMeta.authors ?? 0} auteurs référencés</p>
              <p>{stats?.catalogMeta.categories ?? 0} catégories</p>
              <p>{stats?.catalogMeta.publishers ?? 0} éditeurs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <RecentActivityFeed items={activityQuery.data ?? []} isLoading={activityQuery.isLoading} />
    </div>
  );
}

function ReaderDashboard() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <Wallet className="size-8 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">
          Votre espace personnel (emprunts en cours, réservations, historique) sera disponible à l'Étape 13.
        </p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Bonjour {user?.firstName} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Connecté en tant que {ROLE_LABELS[user?.role ?? ''] ?? user?.role}.
        </p>
      </div>

      {hasRole('ADMIN', 'LIBRARIAN') ? <StaffDashboard /> : <ReaderDashboard />}
    </div>
  );
}
