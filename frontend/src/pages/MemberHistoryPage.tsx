import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { memberPortalService } from '@/services/memberPortal.service';
import { BORROW_STATUS_CONFIG, FINE_STATUS_CONFIG } from '@/utils/statusConfig';

export default function MemberHistoryPage() {
  const query = useQuery({ queryKey: ['member-portal', 'history'], queryFn: memberPortalService.history });
  const date = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Chargement de votre historique…</p>;
  if (!query.data) return <p className="text-sm text-destructive">Impossible de charger votre historique.</p>;
  const { borrows, reservations, fines } = query.data;
  return <div className="space-y-6"><div><h1 className="font-display text-2xl font-semibold">Mon historique</h1><p className="mt-1 text-sm text-muted-foreground">Vos emprunts, réservations et amendes.</p></div><Card><CardContent className="py-5"><h2 className="font-display font-semibold">Emprunts</h2><div className="mt-4 space-y-3">{borrows.length === 0 ? <p className="text-sm text-muted-foreground">Aucun emprunt.</p> : borrows.map((item) => <div key={item.id} className="flex justify-between gap-3 border-b pb-3 last:border-0"><span className="text-sm">{item.bookCopy?.book?.title ?? 'Livre'}</span><Badge variant={BORROW_STATUS_CONFIG[item.status]?.variant}>{BORROW_STATUS_CONFIG[item.status]?.label ?? item.status}</Badge></div>)}</div></CardContent></Card><Card><CardContent className="py-5"><h2 className="font-display font-semibold">Réservations</h2><div className="mt-4 space-y-3">{reservations.length === 0 ? <p className="text-sm text-muted-foreground">Aucune réservation.</p> : reservations.map((item) => <div key={item.id} className="flex justify-between gap-3 border-b pb-3 last:border-0"><span className="text-sm">{item.book?.title ?? 'Livre'} · {date(item.reservationDate)}</span><Badge variant="outline">{item.status}</Badge></div>)}</div></CardContent></Card><Card><CardContent className="py-5"><h2 className="font-display font-semibold">Amendes</h2><div className="mt-4 space-y-3">{fines.length === 0 ? <p className="text-sm text-muted-foreground">Aucune amende.</p> : fines.map((item) => <div key={item.id} className="flex justify-between gap-3 border-b pb-3 last:border-0"><span className="text-sm">{item.reason ?? 'Amende bibliothèque'} · {item.amount}</span><Badge variant={FINE_STATUS_CONFIG[item.status]?.variant}>{FINE_STATUS_CONFIG[item.status]?.label ?? item.status}</Badge></div>)}</div></CardContent></Card></div>;
}
