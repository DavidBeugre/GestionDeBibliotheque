import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: boolean;
  trend?: { value: number; label: string };
  isLoading?: boolean;
}

export function StatCard({ label, value, icon: Icon, accent = false, trend, isLoading }: StatCardProps) {
  return (
    <Card className={cn('card-spine pl-1', accent && 'card-spine-accent')}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="flex items-baseline gap-2">
            <p className="font-data text-2xl font-semibold">{value}</p>
            {trend && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  trend.value >= 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.value >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {trend.label}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
