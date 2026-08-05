import { buildBookWhereClause } from '../bookQuery.util';

describe('buildBookWhereClause', () => {
  it('devrait renvoyer un objet vide si aucun filtre n’est fourni', () => {
    expect(buildBookWhereClause({})).toEqual({});
  });

  it('devrait filtrer par catégorie, éditeur, statut et langue', () => {
    const where = buildBookWhereClause({
      categoryId: 'cat-1',
      publisherId: 'pub-1',
      status: 'ACTIVE' as never,
      language: 'Français',
    });
    expect(where).toEqual({
      categoryId: 'cat-1',
      publisherId: 'pub-1',
      status: 'ACTIVE',
      language: 'Français',
    });
  });

  it('devrait filtrer par auteur via la relation many-to-many', () => {
    const where = buildBookWhereClause({ authorId: 'auth-1' });
    expect(where.authors).toEqual({ some: { authorId: 'auth-1' } });
  });

  it('devrait construire une plage d’années avec gte/lte', () => {
    const where = buildBookWhereClause({ yearFrom: 2000, yearTo: 2020 });
    expect(where.year).toEqual({ gte: 2000, lte: 2020 });
  });

  it('devrait construire une plage d’années ouverte (yearFrom seul)', () => {
    const where = buildBookWhereClause({ yearFrom: 2015 });
    expect(where.year).toEqual({ gte: 2015 });
  });

  it('devrait construire une clause OR multi-champs pour la recherche texte', () => {
    const where = buildBookWhereClause({ search: 'Kourouma' });
    expect(Array.isArray(where.OR)).toBe(true);
    expect(where.OR).toHaveLength(6);
    expect(where.OR?.[0]).toEqual({ title: { contains: 'Kourouma', mode: 'insensitive' } });
  });

  it('ne devrait pas ajouter de clause OR si la recherche est une chaîne vide', () => {
    const where = buildBookWhereClause({ search: '   ' });
    expect(where.OR).toBeUndefined();
  });

  it('devrait filtrer par tag', () => {
    const where = buildBookWhereClause({ tag: 'classique' });
    expect(where.tags).toEqual({ has: 'classique' });
  });

  it('devrait combiner plusieurs filtres simultanément', () => {
    const where = buildBookWhereClause({ categoryId: 'cat-1', search: 'roman', yearFrom: 1990 });
    expect(where.categoryId).toBe('cat-1');
    expect(where.year).toEqual({ gte: 1990 });
    expect(where.OR).toBeDefined();
  });
});
