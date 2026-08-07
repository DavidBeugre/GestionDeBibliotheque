import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { notificationService } from '@/services/notification.service';
import { queryKeys } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const client = useQueryClient();
  const notificationsQuery = useQuery({ queryKey: queryKeys.notifications({ page }), queryFn: () => notificationService.list({ page, limit: 20 }) });
  const refresh = () => client.invalidateQueries({ queryKey: ['notifications'] });
  const markReadMutation = useMutation({ mutationFn: notificationService.markRead, onSuccess: refresh, onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de mettre à jour la notification')) });
  const markAllMutation = useMutation({ mutationFn: notificationService.markAllRead, onSuccess: () => { refresh(); toast.success('Toutes les notifications sont lues'); }, onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de mettre à jour les notifications')) });
  const deleteMutation = useMutation({ mutationFn: notificationService.remove, onSuccess: () => { refresh(); toast.success('Notification supprimée'); }, onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de supprimer la notification')) });
  const items = notificationsQuery.data?.items ?? [];

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="font-display text-2xl font-semibold">Notifications</h1><p className="text-sm text-muted-foreground">Vos alertes de réservation, échéance et activité.</p></div><Button variant="outline" onClick={() => markAllMutation.mutate()} isLoading={markAllMutation.isPending}><CheckCheck className="size-4" /> Tout marquer comme lu</Button></div>
    {notificationsQuery.isLoading ? <p className="text-sm text-muted-foreground">Chargement des notifications…</p> : items.length === 0 ? <EmptyState icon={Bell} title="Aucune notification" description="Les nouvelles alertes apparaîtront ici." /> : <Card className="divide-y"><div>{items.map((notification) => <div key={notification.id} className={`flex gap-3 p-4 ${notification.isRead ? '' : 'bg-primary/[0.04]'}`}><div className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.isRead ? 'bg-muted-foreground/30' : 'bg-primary'}`} /><button className="min-w-0 flex-1 text-left" onClick={() => { if (!notification.isRead) markReadMutation.mutate(notification.id); if (notification.link) navigate(notification.link); }}><div className="flex flex-wrap items-center gap-x-2"><p className="font-medium">{notification.title}</p>{!notification.isRead && <span className="text-xs text-primary">Nouveau</span>}</div><p className="mt-1 text-sm text-muted-foreground">{notification.message}</p><p className="mt-2 text-xs text-muted-foreground">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notification.createdAt))}</p></button><div className="flex shrink-0 gap-1">{!notification.isRead && <Button size="icon" variant="ghost" aria-label="Marquer comme lu" onClick={() => markReadMutation.mutate(notification.id)}><Check className="size-4" /></Button>}<Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => deleteMutation.mutate(notification.id)}><Trash2 className="size-4 text-destructive" /></Button></div></div>)}</div>{notificationsQuery.data && <div className="px-4"><Pagination meta={notificationsQuery.data.meta} onPageChange={setPage} /></div>}</Card>}
  </div>;
}
