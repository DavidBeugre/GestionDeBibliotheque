import { describe, expect, it } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('devrait fusionner des classes simples', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
  });

  it('devrait résoudre les conflits Tailwind en gardant la dernière classe', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('devrait ignorer les valeurs falsy (conditions)', () => {
    expect(cn('base', false && 'hidden', undefined, null, 'visible')).toBe('base visible');
  });

  it('devrait gérer un objet de classes conditionnelles', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });
});
