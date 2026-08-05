import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { env } from '../config/env';

const DEFAULT_SETTINGS_ID = 'default';

export interface EffectiveSettings {
  borrowDurationDays: number;
  maxBorrowsPerUser: number;
  finePerDay: number;
  reservationExpiryHours: number;
  currency: string;
}

export class SettingsRepository {
  static async get(): Promise<EffectiveSettings> {
    const row = await prisma.librarySettings.findUnique({ where: { id: DEFAULT_SETTINGS_ID } });
    if (!row) {
      // Filet de sécurité si le seed n'a pas encore été exécuté : on retombe sur les valeurs .env
      return {
        borrowDurationDays: env.business.defaultBorrowDurationDays,
        maxBorrowsPerUser: env.business.defaultMaxBorrowsPerUser,
        finePerDay: env.business.defaultFinePerDay,
        reservationExpiryHours: env.business.reservationExpiryHours,
        currency: 'XOF',
      };
    }
    return {
      borrowDurationDays: row.borrowDurationDays,
      maxBorrowsPerUser: row.maxBorrowsPerUser,
      finePerDay: Number(row.finePerDay),
      reservationExpiryHours: env.business.reservationExpiryHours,
      currency: row.currency,
    };
  }

  /** Renvoie la ligne complète de paramètres (crée la ligne par défaut si elle n'existe pas encore). */
  static async getFull() {
    const existing = await prisma.librarySettings.findUnique({ where: { id: DEFAULT_SETTINGS_ID } });
    if (existing) return existing;
    return prisma.librarySettings.create({ data: { id: DEFAULT_SETTINGS_ID } });
  }

  static async update(data: Prisma.LibrarySettingsUpdateInput) {
    await this.getFull(); // garantit l'existence de la ligne avant mise à jour
    return prisma.librarySettings.update({ where: { id: DEFAULT_SETTINGS_ID }, data });
  }
}
