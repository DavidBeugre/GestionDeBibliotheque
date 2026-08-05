import { Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ComingSoonPage({ title, step }: { title: string; step: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <Construction className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Cette page sera construite à l'<strong>{step}</strong>. La navigation, l'authentification et les
            permissions qui la protègent sont, elles, déjà fonctionnelles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
