import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BookMarked, CheckCircle2, Plus, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { reservationService } from '@/services/reservation.service';
import { queryKeys, PERMISSIONS } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { BadgeProps } from '@/components/ui/badge';
import { NewReservationDialog } from './NewReservationDialog';

const RESERVATION_STATUS_CONFIG: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING: { label: 'En attente', variant: 'secondary' },
  AVAILABLE: { label: 'Disponible', variant: 'success' },
  FULFILLED: { label: 'Récupérée', variant: 'accent' },
  CANCELLED: { label: 'Annulée', variant: 'outline' },
  EXPIRED: { label: 'Expirée', variant: 'destructive' },
};

export default function ReservationsListPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const canManage = hasPermission(PERMISSIONS.BORROW_MANAGE);
  const params = { page, limit: 15, status };

  const reservationsQuery = useQuery({
    queryKey: queryKeys.reservations(params),
    queryFn: () => reservationService.list(params),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    queryClient.invalidateQueries({ queryKey: ['borrows'] });
    queryClient.invalidateQueries({ queryKey: ['books'] });
  }

  const cancelMutation = useMutation({
    mutationFn: (id: string) => reservationService.cancel(id),
    onSuccess: () => {
      invalidate();
      toast.success('Réservation annulée');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible d'annuler la réservation")),
  });

  const fulfillMutation = useMutation({
    mutationFn: (id: string) => reservationService.fulfill(id),
    onSuccess: () => {
      invalidate();
      toast.success('Réservation convertie en emprunt');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de convertir la réservation')),
  });

  const reservations = reservationsQuery.data?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Réservations</h1>
          <p className="text-sm text-muted-foreground">{reservationsQuery.data?.meta.total ?? 0} réservations enregistrées</p>
        </div>
        {canManage && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" /> Nouvelle réservation
          </Button>
        )}
      </div>

      <Card className="p-4">
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tous statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {Object.entries(RESERVATION_STATUS_CONFIG).map(([value, cfg]) => (
              <SelectItem key={value} value={value}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card>
        {reservationsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : reservations.length === 0 ? (
          <EmptyState icon={BookMarked} title="Aucune réservation" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adhérent</TableHead>
                <TableHead>Livre</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead>Statut</TableHead>
                {canManage && <TableHead className="w-40" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">
                    {r.member?.user.firstName} {r.member?.user.lastName}
                  </TableCell>
                  <TableCell className="text-sm">{r.book?.title ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(r.expiryDate), 'd MMM yyyy HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={RESERVATION_STATUS_CONFIG[r.status]?.variant}>{RESERVATION_STATUS_CONFIG[r.status]?.label}</Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex gap-1.5">
                        {r.status === 'AVAILABLE' && (
                          <Button size="sm" variant="outline" onClick={() => fulfillMutation.mutate(r.id)}>
                            <CheckCircle2 className="size-3.5" /> Convertir
                          </Button>
                        )}
                        {['PENDING', 'AVAILABLE'].includes(r.status) && (
                          <Button size="sm" variant="ghost" onClick={() => cancelMutation.mutate(r.id)}>
                            <XCircle className="size-3.5" /> Annuler
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {reservationsQuery.data && <Pagination meta={reservationsQuery.data.meta} onPageChange={setPage} />}
      </Card>

      <NewReservationDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
