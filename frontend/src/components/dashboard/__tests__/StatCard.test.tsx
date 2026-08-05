import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookOpen } from 'lucide-react';
import { StatCard } from '../StatCard';

describe('StatCard', () => {
  it('devrait afficher le libellé et la valeur', () => {
    render(<StatCard label="Livres au catalogue" value={128} icon={BookOpen} />);
    expect(screen.getByText('Livres au catalogue')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
  });

  it('devrait afficher un squelette plutôt que la valeur pendant le chargement', () => {
    render(<StatCard label="Adhérents actifs" value={42} icon={BookOpen} isLoading />);
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('devrait afficher la tendance quand elle est fournie', () => {
    render(<StatCard label="Emprunts" value={10} icon={BookOpen} trend={{ value: 5, label: '+5%' }} />);
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });
});
