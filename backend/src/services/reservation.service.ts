import { ReservationStatus, NotificationType } from '@prisma/client';
import { ReservationRepository } from '../repositories/reservation.repository';
import { BookRepository } from '../repositories/book.repository';
import { BookCopyRepository } from '../repositories/bookCopy.repository';
import { MemberRepository } from '../repositories/member.repository';
import { ApiError } from '../utils/ApiError';
import { SettingsRepository } from '../repositories/settings.repository';
import { addHours } from '../utils/circulation.util';
import { PaginationParams, buildPaginationMeta } from '../utils/pagination.util';
import { EmailService } from './email.service';
import { prisma } from '../config/database';

interface ReservationFilters {
  memberId?: string;
  bookId?: string;
  status?: ReservationStatus;
}

export class ReservationService {
  static async list(pagination: PaginationParams, filters: ReservationFilters) {
    const where: Record<string, unknown> = {};
    if (filters.memberId) where.memberId = filters.memberId;
    if (filters.bookId) where.bookId = filters.bookId;
    if (filters.status) where.status = filters.status;

    const { items, total } = await ReservationRepository.findMany(
      where as never,
      pagination.skip,
      pagination.limit,
      pagination.sort,
      pagination.order
    );
    return { items, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  static async getById(id: string) {
    const reservation = await ReservationRepository.findById(id);
    if (!reservation) throw ApiError.notFound('Réservation introuvable');
    return reservation;
  }

  static async create(memberId: string, bookId: string) {
    const member = await MemberRepository.findById(memberId);
    if (!member) throw ApiError.notFound('Adhérent introuvable');
    if (member.status !== 'ACTIVE') throw ApiError.forbidden("Le compte de l'adhérent n'est pas actif");

    const book = await BookRepository.findById(bookId);
    if (!book) throw ApiError.notFound('Livre introuvable');

    if (book.availableCopies > 0) {
      throw ApiError.conflict('Un exemplaire est actuellement disponible : empruntez-le directement plutôt que de réserver');
    }

    const existing = await ReservationRepository.findPendingForMemberAndBook(memberId, bookId);
    if (existing) throw ApiError.conflict('Une réservation est déjà en cours pour ce livre');

    const settings = await SettingsRepository.get();
    const expiryDate = addHours(new Date(), settings.reservationExpiryHours);

    return ReservationRepository.create({
      member: { connect: { id: memberId } },
      book: { connect: { id: bookId } },
      expiryDate,
    });
  }

  static async cancel(id: string): Promise<void> {
    const reservation = await this.getById(id);
    if (!['PENDING', 'AVAILABLE'].includes(reservation.status)) {
      throw ApiError.conflict('Seule une réservation en attente ou disponible peut être annulée');
    }

    // Si la réservation avait déjà réservé un exemplaire physique, on le libère et on
    // propose immédiatement le prochain de la file d'attente.
    if (reservation.status === 'AVAILABLE') {
      await this.releaseHeldCopyAndOfferNext(reservation.bookId);
    }

    await ReservationRepository.update(id, { status: ReservationStatus.CANCELLED });
  }

  /** Bascule en EXPIRED toutes les réservations dont l'échéance est dépassée, et enchaîne la file d'attente. */
  static async expireOverdue(): Promise<{ count: number }> {
    const expired = await ReservationRepository.findExpired();

    for (const reservation of expired) {
      await ReservationRepository.update(reservation.id, { status: ReservationStatus.EXPIRED });
      if (reservation.status === 'AVAILABLE') {
        await this.releaseHeldCopyAndOfferNext(reservation.bookId);
      }
    }

    return { count: expired.length };
  }

  /**
   * Cherche la plus ancienne réservation PENDING pour un livre et lui propose l'exemplaire
   * (statut -> AVAILABLE, expiration de retrait fixée, notification envoyée).
   * Appelée après un retour de livre (BorrowService) ou l'expiration d'une offre précédente.
   */
  static async offerNextReservation(bookId: string): Promise<boolean> {
    const next = await ReservationRepository.findOldestPendingForBook(bookId);
    if (!next) return false;

    const settings = await SettingsRepository.get();
    const expiryDate = addHours(new Date(), settings.reservationExpiryHours);

    await ReservationRepository.update(next.id, {
      status: ReservationStatus.AVAILABLE,
      notifiedAt: new Date(),
      expiryDate,
    });

    const member = await MemberRepository.findById(next.memberId);
    if (member) {
      await prisma.notification.create({
        data: {
          userId: member.userId,
          type: NotificationType.RESERVATION_AVAILABLE,
          title: 'Votre réservation est disponible',
          message: `Le livre que vous avez réservé est disponible. Vous avez ${settings.reservationExpiryHours}h pour venir le récupérer.`,
        },
      });
      await EmailService.sendReservationAvailableEmail(
        member.user.email,
        member.user.firstName,
        settings.reservationExpiryHours
      );
    }

    return true;
  }

  private static async releaseHeldCopyAndOfferNext(bookId: string): Promise<void> {
    const heldCopy = await prisma.bookCopy.findFirst({ where: { bookId, status: 'RESERVED' } });
    const offered = await this.offerNextReservation(bookId);

    if (heldCopy && !offered) {
      await BookCopyRepository.update(heldCopy.id, { status: 'AVAILABLE' });
      await BookRepository.recalculateCopyCounts(bookId);
    }
    // Si une nouvelle réservation a été proposée, l'exemplaire reste RESERVED pour le prochain adhérent.
  }
}
