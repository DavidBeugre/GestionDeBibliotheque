import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Wand2, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { fineService } from '@/services/fine.service';
import { queryKeys, PERMISSIONS } from '@/constants';
import { FINE_STATUS_CONFIG } from '@/utils/statusConfig';
import type { Fine } from '@/types';
import { PaymentDialog } from './PaymentDialog';
import { WaiveFineDialog } from './WaiveFineDialog';

export default function FinesListPage() {
  const { hasPermission } = useAuth();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [payingFine, setPayingFine] = useState<Fine | null>(null);
  const [waivingFine, setWaivingFine] = useState<Fine | null>(null);

  const canManage = hasPermission(PERMISSIONS.FINE_MANAGE);
  const params = { page, limit: 15, status };

  const finesQuery = useQuery({
    queryKey: queryKeys.fines(params),
    queryFn: () => fineService.list(params),
  });

  const fines = finesQuery.data?.items ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Amendes</h1>
        <p className="text-sm text-muted-foreground">{finesQuery.data?.meta.total ?? 0} amendes enregistrées</p>
      </div>

      <Card className="p-4">
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tous statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {Object.entries(FINE_STATUS_CONFIG).map(([value, cfg]) => (
              <SelectItem key={value} value={value}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card>
        {finesQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : fines.length === 0 ? (
          <EmptyState icon={Wallet} title="Aucune amende" description="Aucune amende ne correspond à ces critères." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adhérent</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                {canManage && <TableHead className="w-52" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fines.map((fine) => (
                <TableRow key={fine.id}>
                  <TableCell className="text-sm">
                    {fine.member?.user.firstName} {fine.member?.user.lastName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fine.reason ?? '—'}</TableCell>
                  <TableCell className="font-data text-sm">{fine.amount}</TableCell>
                  <TableCell>
                    <Badge variant={FINE_STATUS_CONFIG[fine.status]?.variant}>{FINE_STATUS_CONFIG[fine.status]?.label}</Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {['UNPAID', 'PARTIALLY_PAID'].includes(fine.status) && (
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setPayingFine(fine)}>
                            <Banknote className="size-3.5" /> Encaisser
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setWaivingFine(fine)}>
                            <Wand2 className="size-3.5" /> Remettre
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {finesQuery.data && <Pagination meta={finesQuery.data.meta} onPageChange={setPage} />}
      </Card>

      <PaymentDialog fine={payingFine} open={!!payingFine} onOpenChange={(o) => !o && setPayingFine(null)} />
      <WaiveFineDialog fine={waivingFine} open={!!waivingFine} onOpenChange={(o) => !o && setWaivingFine(null)} />
    </div>
  );
}
