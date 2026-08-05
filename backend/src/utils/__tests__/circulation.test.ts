import { addDays, addHours, computeLateDays, computeLateFineAmount, sumPayments } from '../circulation.util';

describe('computeLateDays', () => {
  it('devrait renvoyer 0 si le retour est avant ou à échéance', () => {
    const due = new Date('2026-01-15T00:00:00Z');
    expect(computeLateDays(due, new Date('2026-01-14T00:00:00Z'))).toBe(0);
    expect(computeLateDays(due, due)).toBe(0);
  });

  it('devrait arrondir au jour supérieur pour un retard partiel', () => {
    const due = new Date('2026-01-15T00:00:00Z');
    const returned = new Date('2026-01-15T05:00:00Z'); // 5h de retard -> 1 jour
    expect(computeLateDays(due, returned)).toBe(1);
  });

  it('devrait compter correctement plusieurs jours de retard', () => {
    const due = new Date('2026-01-15T00:00:00Z');
    const returned = new Date('2026-01-18T00:00:00Z'); // 3 jours pile
    expect(computeLateDays(due, returned)).toBe(3);
  });
});

describe('computeLateFineAmount', () => {
  it('devrait multiplier les jours de retard par le tarif journalier', () => {
    const due = new Date('2026-01-15T00:00:00Z');
    const returned = new Date('2026-01-18T00:00:00Z');
    expect(computeLateFineAmount(due, returned, 100)).toBe(300);
  });

  it('devrait renvoyer 0 sans retard', () => {
    const due = new Date('2026-01-15T00:00:00Z');
    expect(computeLateFineAmount(due, due, 100)).toBe(0);
  });
});

describe('addDays / addHours', () => {
  it('addDays devrait ajouter le bon nombre de jours', () => {
    const result = addDays(new Date('2026-01-01T00:00:00Z'), 14);
    expect(result.getUTCDate()).toBe(15);
  });

  it('addHours devrait ajouter le bon nombre d’heures', () => {
    const result = addHours(new Date('2026-01-01T00:00:00Z'), 48);
    expect(result.getUTCDate()).toBe(3);
  });
});

describe('sumPayments', () => {
  it('devrait additionner les montants des paiements', () => {
    expect(sumPayments([{ amount: 100 }, { amount: 250 }, { amount: 50 }])).toBe(400);
  });

  it('devrait renvoyer 0 pour une liste vide', () => {
    expect(sumPayments([])).toBe(0);
  });
});
