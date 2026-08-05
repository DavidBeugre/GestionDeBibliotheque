import { FileQuestion } from 'lucide-react';
import { StatePage } from './StatePage';

export default function NotFoundPage() {
  return (
    <StatePage
      icon={FileQuestion}
      code="404"
      title="Page introuvable"
      description="La page que vous cherchez n'existe pas ou a été déplacée."
    />
  );
}
