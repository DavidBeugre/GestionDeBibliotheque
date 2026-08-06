import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Camera, MoreHorizontal, QrCode, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MembershipCard } from '@/components/members/MembershipCard';
import { useAuth } from '@/contexts/AuthContext';
import { memberService } from '@/services/member.service';
import { queryKeys, PERMISSIONS } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { BORROW_STATUS_CONFIG, FINE_STATUS_CONFIG, MEMBER_STATUS_CONFIG, MEMBER_TYPE_LABELS } from '@/utils/statusConfig';
import { Clock3, BookMarked, Wallet } from 'lucide-react';
import { MemberFormDialog } from './MemberFormDialog';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canManage = hasPermission(PERMISSIONS.MEMBER_MANAGE);

  const memberQuery = useQuery({
    queryKey: queryKeys.member(id!),
    queryFn: () => memberService.getById(id!),
    enabled: !!id,
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.memberHistory(id!),
    queryFn: () => memberService.getHistory(id!),
    enabled: !!id,
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => memberService.uploadPhoto(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.member(id!) });
      toast.success('Photo mise à jour');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de mettre à jour la photo')),
  });

  const qrMutation = useMutation({
    mutationFn: () => memberService.generateQrCode(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.member(id!) });
      toast.success('QR Code généré');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de générer le QR Code')),
  });

  const statusMutation = useMutation({
    mutationFn: (action: 'suspend' | 'reactivate') =>
      action === 'suspend' ? memberService.suspend(id!) : memberService.reactivate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.member(id!) });
      toast.success('Statut mis à jour');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de mettre à jour le statut')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => memberService.remove(id!),
    onMutate: async () => {
      const membersKey = ['members'] as const;
      await queryClient.cancelQueries({ queryKey: membersKey });
      queryClient.setQueriesData({ queryKey: membersKey }, (cached: unknown) => {
        if (!cached || typeof cached !== 'object' || !Array.isArray((cached as { items?: unknown[] }).items)) {
          return cached;
        }
        const list = cached as { items: Array<{ id: string }> };
        return { ...list, items: list.items.filter((item) => item.id !== id) };
      });
      setDeleteOpen(false);
      navigate('/members');
    },
    onSuccess: () => {
      toast.success('Adhérent supprimé');
      queryClient.invalidateQueries({ queryKey: queryKeys.members() });
      navigate('/members');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible de supprimer l'adhérent")),
  });

  if (memberQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="aspect-[85.6/54] w-full max-w-xs rounded-xl" />
          <Skeleton className="h-64 w-full lg:col-span-2" />
        </div>
      </div>
    );
  }

  const member = memberQuery.data;
  if (!member) return null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/members')} className="-ml-2">
        <ArrowLeft className="size-4" /> Retour aux adhérents
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <MembershipCard member={member} qrCodeUrl={member.qrCode} />
          <div className="flex max-w-xs gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) photoMutation.mutate(file);
                }}
              />
              <Button variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()} isLoading={photoMutation.isPending}>
                <Camera className="size-3.5" /> Photo
              </Button>
              <Button variant="outline" size="sm" onClick={() => qrMutation.mutate()} isLoading={qrMutation.isPending} aria-label="Générer le QR Code">
                <QrCode className="size-3.5" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-3.5" /> Supprimer
              </Button>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Badge variant={MEMBER_STATUS_CONFIG[member.status]?.variant}>{MEMBER_STATUS_CONFIG[member.status]?.label}</Badge>
                <Badge variant="outline">{MEMBER_TYPE_LABELS[member.memberType] ?? member.memberType}</Badge>
              </div>
              <h1 className="font-display text-2xl font-semibold leading-tight">
                {member.user.firstName} {member.user.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">{member.user.email}{member.user.phone && ` · ${member.user.phone}`}</p>
            </div>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>Modifier</DropdownMenuItem>
                  {member.status === 'ACTIVE' ? (
                    <DropdownMenuItem destructive onClick={() => statusMutation.mutate('suspend')}>
                      <ShieldOff className="size-3.5" /> Suspendre
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => statusMutation.mutate('reactivate')}>
                      <ShieldCheck className="size-3.5" /> Réactiver
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem destructive onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="size-3.5" /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Tabs defaultValue="borrows">
            <TabsList>
              <TabsTrigger value="borrows">Emprunts</TabsTrigger>
              <TabsTrigger value="reservations">Réservations</TabsTrigger>
              <TabsTrigger value="fines">Amendes</TabsTrigger>
            </TabsList>

            <TabsContent value="borrows">
              <Card>
                {historyQuery.isLoading ? (
                  <div className="space-y-2 p-5">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : !historyQuery.data?.borrows.length ? (
                  <EmptyState icon={Clock3} title="Aucun emprunt" description="Cet adhérent n'a encore emprunté aucun livre." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Livre</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyQuery.data.borrows.map((borrow) => (
                        <TableRow key={borrow.id}>
                          <TableCell className="text-sm">{borrow.bookCopy?.book.title ?? '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(borrow.dueDate), { addSuffix: true, locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={BORROW_STATUS_CONFIG[borrow.status]?.variant}>{BORROW_STATUS_CONFIG[borrow.status]?.label}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="reservations">
              <Card>
                {!historyQuery.data?.reservations.length ? (
                  <EmptyState icon={BookMarked} title="Aucune réservation" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Livre</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyQuery.data.reservations.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">{r.book?.title ?? '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{r.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="fines">
              <Card>
                {!historyQuery.data?.fines.length ? (
                  <EmptyState icon={Wallet} title="Aucune amende" description="Aucune amende enregistrée pour cet adhérent." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Motif</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyQuery.data.fines.map((fine) => (
                        <TableRow key={fine.id}>
                          <TableCell className="text-sm">{fine.reason ?? '—'}</TableCell>
                          <TableCell className="font-data text-sm">{fine.amount}</TableCell>
                          <TableCell>
                            <Badge variant={FINE_STATUS_CONFIG[fine.status]?.variant}>{FINE_STATUS_CONFIG[fine.status]?.label}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MemberFormDialog open={editOpen} onOpenChange={setEditOpen} member={member} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer cet adhérent ?"
        description="Cette action est irréversible. Elle est refusée si l'adhérent possède encore un emprunt en cours ou des amendes impayées."
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
