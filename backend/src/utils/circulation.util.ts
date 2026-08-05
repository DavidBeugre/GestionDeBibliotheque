/** Nombre de jours de retard entre la date de retour effective et la date d'échéance (0 si pas de retard). */
export function computeLateDays(dueDate: Date, returnDate: Date): number {
  const diffMs = returnDate.getTime() - dueDate.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/** Montant de l'amende de retard = nombre de jours de retard x montant journalier. */
export function computeLateFineAmount(dueDate: Date, returnDate: Date, finePerDay: number): number {
  return computeLateDays(dueDate, returnDate) * finePerDay;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/** Nombre total effectivement payé pour une amende, à partir de la liste de ses paiements. */
export function sumPayments(payments: { amount: number }[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

export const MAX_RENEWALS = 2;
