import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock3, MoreHorizontal, Plus, RotateCcw, PackageX, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { borrowService } from '@/services/borrow.service';
import { queryKeys, PERMISSIONS } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { BORROW_STATUS_CONFIG } from '@/utils/statusConfig';
import { NewBorrowDialog } from './NewBorrowDialog';

export default function BorrowsListPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [status, setStatus] = useState<string | undefined>();
  const [overdue, setOverdue] = useState(false);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const canManage = hasPermission(PERMISSIONS.BORROW_MANAGE);
  const params = { page, limit: 15, status, overdue: overdue || undefined };

  const borrowsQuery = useQuery({
    queryKey: queryKeys.borrows(params),
    queryFn: () => borrowService.list(params),
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['borrows'] });
    queryClient.invalidateQueries({ queryKey: ['books'] });
    queryClient.invalidateQueries({ queryKey: ['fines'] });
  }

  const returnMutation = useMutation({
    mutationFn: (id: string) => borrowService.returnBorrow(id),
    onSuccess: ({ fine }) => {
      invalidateAll();
      toast.success(fine ? `Retour enregistré — amende de ${fine.amount} générée` : 'Retour enregistré');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible d’enregistrer le retour')),
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => borrowService.renew(id),
    onSuccess: () => {
      invalidateAll();
      toast.success('Emprunt renouvelé');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de renouveler')),
  });

  const lostMutation = useMutation({
    mutationFn: (id: string) => borrowService.markLost(id),
    onSuccess: ({ fine }) => {
      invalidateAll();
      toast.success(fine ? `Livre déclaré perdu — amende de ${fine.amount} générée` : 'Livre déclaré perdu');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de déclarer la perte')),
  });

  const borrows = borrowsQuery.data?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Emprunts</h1>
          <p className="text-sm text-muted-foreground">{borrowsQuery.data?.meta.total ?? 0} emprunts enregistrés</p>
        </div>
        {canManage && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" /> Nouvel emprunt
          </Button>
        )}
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tous statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {Object.entries(BORROW_STATUS_CONFIG).map(([value, cfg]) => (
              <SelectItem key={value} value={value}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={overdue ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setOverdue((v) => !v);
            setPage(1);
          }}
        >
          <Clock3 className="size-3.5" /> En retard uniquement
        </Button>
      </Card>

      <Card>
        {borrowsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : borrows.length === 0 ? (
          <EmptyState icon={Clock3} title="Aucun emprunt trouvé" description="Ajustez vos filtres ou enregistrez un nouvel emprunt." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adhérent</TableHead>
                <TableHead>Livre</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
                {canManage && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {borrows.map((borrow) => (
                <TableRow key={borrow.id}>
                  <TableCell className="text-sm">
                    {borrow.member?.user.firstName} {borrow.member?.user.lastName}
                  </TableCell>
                  <TableCell className="text-sm">{borrow.bookCopy?.book.title ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(borrow.dueDate), { addSuffix: true, locale: fr })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={BORROW_STATUS_CONFIG[borrow.status]?.variant}>{BORROW_STATUS_CONFIG[borrow.status]?.label}</Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {['ONGOING', 'LATE'].includes(borrow.status) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => returnMutation.mutate(borrow.id)}>
                              <Undo2 className="size-3.5" /> Enregistrer le retour
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => renewMutation.mutate(borrow.id)}>
                              <RotateCcw className="size-3.5" /> Renouveler
                            </DropdownMenuItem>
                            <DropdownMenuItem destructive onClick={() => lostMutation.mutate(borrow.id)}>
                              <PackageX className="size-3.5" /> Déclarer perdu
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {borrowsQuery.data && <Pagination meta={borrowsQuery.data.meta} onPageChange={setPage} />}
      </Card>

      <NewBorrowDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
