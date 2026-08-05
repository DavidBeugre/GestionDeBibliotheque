import { ServerCrash } from 'lucide-react';
import { StatePage } from './StatePage';

export default function ServerErrorPage() {
  return (
    <StatePage
      icon={ServerCrash}
      code="500"
      title="Erreur serveur"
      description="Une erreur inattendue est survenue. Merci de réessayer dans quelques instants."
    />
  );
}
