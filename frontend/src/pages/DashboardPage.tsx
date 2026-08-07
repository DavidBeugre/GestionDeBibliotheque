import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TypewriterText } from '@/components/common/TypewriterText';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService } from '@/services/dashboard.service';
import { memberPortalService } from '@/services/memberPortal.service';
import { queryKeys, ROLE_LABELS } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { BORROW_STATUS_CONFIG, FINE_STATUS_CONFIG } from '@/utils/statusConfig';

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
  const queryClient = useQueryClient();
  const portalQuery = useQuery({ queryKey: ['member-portal'], queryFn: memberPortalService.get });
  const qrMutation = useMutation({
    mutationFn: memberPortalService.qrCode,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member-portal'] }),
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de générer votre QR Code')),
  });
  const renewMutation = useMutation({
    mutationFn: memberPortalService.renewBorrow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-portal'] });
      toast.success('Emprunt renouvelé');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de renouveler cet emprunt')),
  });
  const cancelReservationMutation = useMutation({
    mutationFn: memberPortalService.cancelReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-portal'] });
      toast.success('Réservation annulée');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible d’annuler cette réservation')),
  });

  if (portalQuery.isLoading) {
    return <Card><CardContent className="py-10 text-sm text-muted-foreground">Chargement de votre espace personnel…</CardContent></Card>;
  }
  if (portalQuery.isError || !portalQuery.data) {
    return <Card className="border-destructive/30"><CardContent className="py-6 text-sm text-destructive">{getApiErrorMessage(portalQuery.error, 'Impossible de charger votre espace personnel')}</CardContent></Card>;
  }

  const portal = portalQuery.data;
  const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
  const totalDue = portal.fines.reduce((sum, fine) => sum + Number(fine.amount), 0);

  if (portal) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="py-5"><p className="text-sm text-muted-foreground">Emprunts en cours</p><p className="mt-1 font-data text-3xl font-semibold">{portal.borrows.length}</p></CardContent></Card>
          <Card><CardContent className="py-5"><p className="text-sm text-muted-foreground">Réservations actives</p><p className="mt-1 font-data text-3xl font-semibold">{portal.reservations.length}</p></CardContent></Card>
          <Card><CardContent className="py-5"><p className="text-sm text-muted-foreground">Amendes à régulariser</p><p className="mt-1 font-data text-3xl font-semibold">{totalDue}</p></CardContent></Card>
        </div>
        <Card><CardContent className="flex flex-col items-center gap-3 py-5 text-center"><p className="font-medium">Mon QR Code d’adhérent</p>{portal.qrCode?.startsWith('data:image/') ? <img src={portal.qrCode} alt="QR Code adhérent" className="size-36 rounded-md border bg-white p-2" /> : <p className="text-sm text-muted-foreground">Générez votre code pour le présenter au comptoir.</p>}<Button size="sm" onClick={() => qrMutation.mutate()} isLoading={qrMutation.isPending}>{portal.qrCode?.startsWith('data:image/') ? 'Actualiser mon QR Code' : 'Générer mon QR Code'}</Button></CardContent></Card>
        <Card className="card-spine pl-1"><CardContent className="py-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">Carte d’adhérent</p><p className="text-sm text-muted-foreground">{portal.matricule} · {portal.cardNumber ?? 'Carte en préparation'}</p></div><Badge variant={portal.status === 'ACTIVE' ? 'success' : 'warning'}>{portal.status === 'ACTIVE' ? 'Adhésion active' : portal.status}</Badge></div>{portal.subscriptionExpiry && <p className="mt-3 text-sm text-muted-foreground">Valable jusqu’au {formatDate(portal.subscriptionExpiry)}</p>}</CardContent></Card>
        <div className="grid gap-6 lg:grid-cols-2">
          {(portal.borrows.some((borrow) => borrow.status === 'ONGOING') || portal.reservations.length > 0) && <Card><CardContent className="py-5"><h2 className="font-display font-semibold">Actions rapides</h2><div className="mt-4 space-y-3">{portal.borrows.filter((borrow) => borrow.status === 'ONGOING').map((borrow) => <div key={borrow.id} className="flex items-center justify-between gap-3"><span className="truncate text-sm">Renouveler : {borrow.bookCopy.book.title}</span><Button size="sm" variant="outline" onClick={() => renewMutation.mutate(borrow.id)} isLoading={renewMutation.isPending}>Renouveler</Button></div>)}{portal.reservations.map((reservation) => <div key={reservation.id} className="flex items-center justify-between gap-3"><span className="truncate text-sm">Annuler : {reservation.book.title}</span><Button size="sm" variant="outline" onClick={() => cancelReservationMutation.mutate(reservation.id)} isLoading={cancelReservationMutation.isPending}>Annuler</Button></div>)}</div></CardContent></Card>}
          <Card><CardContent className="py-5"><h2 className="font-display font-semibold">Mes emprunts</h2><div className="mt-4 space-y-3">{portal.borrows.length === 0 ? <p className="text-sm text-muted-foreground">Aucun emprunt en cours.</p> : portal.borrows.map((borrow) => <div key={borrow.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"><div><p className="text-sm font-medium">{borrow.bookCopy.book.title}</p><p className="text-xs text-muted-foreground">Retour prévu le {formatDate(borrow.dueDate)}</p></div><Badge variant={BORROW_STATUS_CONFIG[borrow.status]?.variant}>{BORROW_STATUS_CONFIG[borrow.status]?.label ?? borrow.status}</Badge></div>)}</div></CardContent></Card>
          <Card><CardContent className="py-5"><h2 className="font-display font-semibold">Mes réservations</h2><div className="mt-4 space-y-3">{portal.reservations.length === 0 ? <p className="text-sm text-muted-foreground">Aucune réservation active.</p> : portal.reservations.map((reservation) => <div key={reservation.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"><div><p className="text-sm font-medium">{reservation.book.title}</p><p className="text-xs text-muted-foreground">Expire le {formatDate(reservation.expiryDate)}</p></div><Badge variant={reservation.status === 'AVAILABLE' ? 'success' : 'warning'}>{reservation.status === 'AVAILABLE' ? 'Disponible' : 'En attente'}</Badge></div>)}</div></CardContent></Card>
        </div>
        <Card><CardContent className="py-5"><h2 className="font-display font-semibold">Mes amendes</h2><div className="mt-4 space-y-3">{portal.fines.length === 0 ? <p className="text-sm text-muted-foreground">Aucune amende à régulariser.</p> : portal.fines.map((fine) => <div key={fine.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"><div><p className="text-sm font-medium">{fine.borrow.bookCopy.book.title}</p><p className="text-xs text-muted-foreground">{fine.reason ?? 'Amende bibliothèque'}</p></div><div className="text-right"><p className="text-sm font-semibold">{fine.amount}</p><Badge variant={FINE_STATUS_CONFIG[fine.status]?.variant}>{FINE_STATUS_CONFIG[fine.status]?.label ?? fine.status}</Badge></div></div>)}</div></CardContent></Card>
      </div>
    );
  }

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
          <TypewriterText text={hasRole('ADMIN', 'LIBRARIAN') ? `Pilotez Shelfly en tant que ${ROLE_LABELS[user?.role ?? ''] ?? user?.role}.` : 'Consultez vos emprunts, réservations et votre carte adhérent.'} />
        </p>
      </div>

      {hasRole('ADMIN', 'LIBRARIAN') ? <StaffDashboard /> : <ReaderDashboard />}
    </div>
  );
}
