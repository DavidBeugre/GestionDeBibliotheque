import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StatePageProps {
  icon: LucideIcon;
  code: string;
  title: string;
  description: string;
}

export function StatePage({ icon: Icon, code, title, description }: StatePageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-surface px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary">
        <Icon className="size-7" />
      </div>
      <div className="space-y-1.5">
        <p className="font-data text-sm text-muted-foreground">Erreur {code}</p>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild>
        <Link to="/">Retour à l'accueil</Link>
      </Button>
    </div>
  );
}
