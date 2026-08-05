import { ShieldX } from 'lucide-react';
import { StatePage } from './StatePage';

export default function ForbiddenPage() {
  return (
    <StatePage
      icon={ShieldX}
      code="403"
      title="Accès refusé"
      description="Vous n'avez pas les droits nécessaires pour accéder à cette page."
    />
  );
}
