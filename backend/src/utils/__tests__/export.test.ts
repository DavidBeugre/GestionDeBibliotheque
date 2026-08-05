import { toCsv } from '../export.util';

describe('toCsv', () => {
  it('devrait générer une ligne d’en-tête et des lignes de données', () => {
    const csv = toCsv(
      [
        { key: 'title', label: 'Titre' },
        { key: 'count', label: 'Nombre' },
      ],
      [
        { title: 'Les Misérables', count: 5 },
        { title: 'Candide', count: 3 },
      ]
    );
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Titre,Nombre');
    expect(lines[1]).toBe('Les Misérables,5');
    expect(lines[2]).toBe('Candide,3');
  });

  it('devrait échapper les valeurs contenant une virgule ou des guillemets', () => {
    const csv = toCsv([{ key: 'name', label: 'Nom' }], [{ name: 'Dupont, "Jean"' }]);
    expect(csv.split('\n')[1]).toBe('"Dupont, ""Jean"""');
  });

  it('devrait gérer les valeurs null/undefined comme des chaînes vides', () => {
    const csv = toCsv([{ key: 'x', label: 'X' }], [{ x: null }, { x: undefined }]);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('');
    expect(lines[2]).toBe('');
  });

  it('devrait gérer un tableau de lignes vide (en-tête seul)', () => {
    const csv = toCsv([{ key: 'a', label: 'A' }], []);
    expect(csv).toBe('A');
  });
});
