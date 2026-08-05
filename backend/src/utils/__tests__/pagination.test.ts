import { buildPaginationMeta, parsePagination } from '../pagination.util';

describe('parsePagination', () => {
  it('devrait appliquer les valeurs par défaut si rien n’est fourni', () => {
    const result = parsePagination({}, ['createdAt', 'title']);
    expect(result).toEqual({ page: 1, limit: 20, skip: 0, sort: 'createdAt', order: 'desc' });
  });

  it('devrait calculer correctement le skip selon la page', () => {
    const result = parsePagination({ page: '3', limit: '10' }, ['createdAt']);
    expect(result.skip).toBe(20);
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
  });

  it('devrait plafonner la limite à 100', () => {
    const result = parsePagination({ limit: '500' }, ['createdAt']);
    expect(result.limit).toBe(100);
  });

  it('devrait ignorer un tri non autorisé et revenir au tri par défaut', () => {
    const result = parsePagination({ sort: 'password' }, ['title', 'createdAt'], 'createdAt');
    expect(result.sort).toBe('createdAt');
  });

  it('devrait accepter un tri autorisé', () => {
    const result = parsePagination({ sort: 'title' }, ['title', 'createdAt']);
    expect(result.sort).toBe('title');
  });

  it('devrait ignorer une page négative ou nulle', () => {
    const result = parsePagination({ page: '-5' }, ['createdAt']);
    expect(result.page).toBe(1);
  });
});

describe('buildPaginationMeta', () => {
  it('devrait calculer le nombre total de pages correctement', () => {
    expect(buildPaginationMeta(95, 1, 20)).toEqual({ page: 1, limit: 20, total: 95, totalPages: 5 });
  });

  it('devrait renvoyer au moins 1 page même si total = 0', () => {
    expect(buildPaginationMeta(0, 1, 20).totalPages).toBe(1);
  });
});
