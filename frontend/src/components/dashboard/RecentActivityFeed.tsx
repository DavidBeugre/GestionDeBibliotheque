import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ActivityLogEntry } from '@/types';

export function RecentActivityFeed({ items, isLoading }: { items: ActivityLogEntry[]; isLoading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
        <CardDescription>Derniers événements de circulation enregistrés</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}

        {!isLoading && items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucune activité récente pour le moment.</p>
        )}

        {!isLoading &&
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 border-b border-border py-2.5 last:border-0">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                <Activity className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.description}</p>
                <p className="text-xs text-muted-foreground">
                  {item.user ? `${item.user.firstName} ${item.user.lastName} · ` : ''}
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: fr })}
                </p>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
