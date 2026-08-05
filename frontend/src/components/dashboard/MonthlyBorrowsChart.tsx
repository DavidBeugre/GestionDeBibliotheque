import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlyBorrowsChartProps {
  data: { month: string; borrows: number; returns: number }[];
  isLoading?: boolean;
}

export function MonthlyBorrowsChart({ data, isLoading }: MonthlyBorrowsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité de circulation</CardTitle>
        <CardDescription>Emprunts et retours enregistrés sur les 6 derniers mois</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBorrows" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(158 64% 24%)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(158 64% 24%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38 58% 50%)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(38 58% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(240 10% 90%)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(240 5% 45%)" />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="hsl(240 5% 45%)" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(0 0% 100%)',
                  border: '1px solid hsl(240 10% 89%)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Area type="monotone" dataKey="borrows" name="Emprunts" stroke="hsl(158 64% 24%)" fill="url(#colorBorrows)" strokeWidth={2} />
              <Area type="monotone" dataKey="returns" name="Retours" stroke="hsl(38 58% 50%)" fill="url(#colorReturns)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
