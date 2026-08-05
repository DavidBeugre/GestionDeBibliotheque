import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  it('devrait afficher son contenu', () => {
    render(<Badge>Disponible</Badge>);
    expect(screen.getByText('Disponible')).toBeInTheDocument();
  });

  it('devrait appliquer la classe de la variante success', () => {
    render(<Badge variant="success">Payée</Badge>);
    expect(screen.getByText('Payée').className).toContain('text-success');
  });

  it('devrait appliquer la classe de la variante destructive', () => {
    render(<Badge variant="destructive">Perdu</Badge>);
    expect(screen.getByText('Perdu').className).toContain('text-destructive');
  });
});
