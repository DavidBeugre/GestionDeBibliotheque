import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('devrait afficher son contenu', () => {
    render(<Button>Enregistrer</Button>);
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument();
  });

  it('devrait déclencher onClick au clic', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Cliquer</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('devrait être désactivé quand isLoading est vrai', () => {
    render(<Button isLoading>Chargement</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('ne devrait pas déclencher onClick si désactivé', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Désactivé
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
