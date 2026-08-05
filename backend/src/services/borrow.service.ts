import { AuditAction, BorrowStatus, FineStatus } from '@prisma/client';
import { BorrowRepository } from '../repositories/borrow.repository';
import { BookCopyRepository } from '../repositories/bookCopy.repository';
import { BookRepository } from '../repositories/book.repository';
import { MemberRepository } from '../repositories/member.repository';
import { FineRepository } from '../repositories/fine.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { ApiError } from '../utils/ApiError';
import { addDays, computeLateDays, computeLateFineAmount, MAX_RENEWALS } from '../utils/circulation.util';
import { PaginationParams, buildPaginationMeta } from '../utils/pagination.util';
import { ReservationRepository } from '../repositories/reservation.repository';
import { ReservationService } from './reservation.service';
import { AuditService } from './audit.service';
import { ActivityService } from './activity.service';
import { EmailService } from './email.service';

interface BorrowFilters {
  memberId?: string;
  bookCopyId?: string;
  status?: BorrowStatus;
  overdue?: boolean;
}

export class BorrowService {
  static async list(pagination: PaginationParams, filters: BorrowFilters) {
    const where: Record<string, unknown> = {};
    if (filters.memberId) where.memberId = filters.memberId;
    if (filters.bookCopyId) where.bookCopyId = filters.bookCopyId;
    if (filters.status) where.status = filters.status;
    if (filters.overdue) {
      where.status = { in: ['ONGOING', 'LATE'] };
      where.dueDate = { lt: new Date() };
    }

    const { items, total } = await BorrowRepository.findMany(
      where as never,
      pagination.skip,
      pagination.limit,
      pagination.sort,
      pagination.order
    );
    return { items, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  static async getById(id: string) {
    const borrow = await BorrowRepository.findById(id);
    if (!borrow) throw ApiError.notFound('Emprunt introuvable');
    return borrow;
  }

  static async create(input: { memberId: string; bookCopyId: string }, processedById?: string) {
    const member = await MemberRepository.findById(input.memberId);
    if (!member) throw ApiError.notFound('Adhérent introuvable');
    if (member.status !== 'ACTIVE') {
      throw ApiError.forbidden("Le compte de l'adhérent n'est pas actif, l'emprunt est refusé");
    }

    const copy = await BookCopyRepository.findById(input.bookCopyId);
    if (!copy) throw ApiError.notFound('Exemplaire introuvable');
    if (copy.status !== 'AVAILABLE') {
      throw ApiError.conflict("Cet exemplaire n'est pas disponible à l'emprunt");
    }

    const settings = await SettingsRepository.get();

    const [activeBorrowCount, unpaidFines] = await Promise.all([
      BorrowRepository.countActiveForMember(input.memberId),
      MemberRepository.countUnpaidFines(input.memberId),
    ]);

    if (activeBorrowCount >= settings.maxBorrowsPerUser) {
      throw ApiError.conflict(`Limite d'emprunts atteinte (${settings.maxBorrowsPerUser} maximum)`);
    }
    if (unpaidFines > 0) {
      throw ApiError.conflict('Impossible d’emprunter : des amendes restent impayées');
    }

    const dueDate = addDays(new Date(), settings.borrowDurationDays);

    const borrow = await BorrowRepository.create({
      member: { connect: { id: input.memberId } },
      bookCopy: { connect: { id: input.bookCopyId } },
      dueDate,
      ...(processedById ? { processedBy: { connect: { id: processedById } } } : {}),
    });

    await BookCopyRepository.update(input.bookCopyId, { status: 'BORROWED' });
    await BookRepository.recalculateCopyCounts(copy.bookId);
    await AuditService.record(AuditAction.CREATE, { userId: processedById, entityType: 'Borrow', entityId: borrow.id });
    await ActivityService.record(
      'borrow.created',
      `Emprunt enregistré : "${borrow.bookCopy.book.title}" par ${borrow.member.user.firstName} ${borrow.member.user.lastName}`,
      { userId: processedById, entityType: 'Borrow', entityId: borrow.id }
    );

    return borrow;
  }

  static async returnBorrow(borrowId: string, processedById?: string) {
    const borrow = await this.getById(borrowId);
    if (!['ONGOING', 'LATE'].includes(borrow.status)) {
      throw ApiError.conflict('Cet emprunt a déjà été clôturé');
    }

    const returnDate = new Date();
    const settings = await SettingsRepository.get();
    const lateDays = computeLateDays(borrow.dueDate, returnDate);

    const updated = await BorrowRepository.update(borrowId, {
      returnDate,
      status: BorrowStatus.RETURNED,
      ...(processedById ? { processedBy: { connect: { id: processedById } } } : {}),
    });

    let fine = null;
    if (lateDays > 0) {
      const amount = computeLateFineAmount(borrow.dueDate, returnDate, settings.finePerDay);
      fine = await FineRepository.create({
        borrow: { connect: { id: borrowId } },
        member: { connect: { id: borrow.memberId } },
        amount,
        reason: `Retard de ${lateDays} jour(s)`,
        status: FineStatus.UNPAID,
      });
    }

    // Une réservation en attente pour ce livre ? On lui propose l'exemplaire plutôt que de le
    // remettre simplement "disponible" pour tout le monde.
    const offered = await ReservationService.offerNextReservation(borrow.bookCopy.bookId);
    await BookCopyRepository.update(borrow.bookCopyId, { status: offered ? 'RESERVED' : 'AVAILABLE' });
    await BookRepository.recalculateCopyCounts(borrow.bookCopy.bookId);

    await AuditService.record(AuditAction.UPDATE, {
      userId: processedById,
      entityType: 'Borrow',
      entityId: borrowId,
      metadata: { action: 'return', lateDays },
    });
    await ActivityService.record(
      'borrow.returned',
      `Retour enregistré : "${borrow.bookCopy.book.title}"${lateDays > 0 ? ` (${lateDays} jour(s) de retard)` : ''}`,
      { userId: processedById, entityType: 'Borrow', entityId: borrowId }
    );

    return { borrow: updated, fine };
  }

  static async renew(borrowId: string) {
    const borrow = await this.getById(borrowId);
    if (borrow.status !== 'ONGOING') {
      throw ApiError.conflict('Seul un emprunt en cours (non en retard) peut être renouvelé');
    }
    if (borrow.renewalCount >= MAX_RENEWALS) {
      throw ApiError.conflict(`Nombre maximal de renouvellements atteint (${MAX_RENEWALS})`);
    }

    const pendingReservation = await ReservationRepository.findOldestPendingForBook(borrow.bookCopy.bookId);
    if (pendingReservation) {
      throw ApiError.conflict('Impossible de renouveler : un autre adhérent attend ce livre');
    }

    const unpaidFines = await MemberRepository.countUnpaidFines(borrow.memberId);
    if (unpaidFines > 0) {
      throw ApiError.conflict('Impossible de renouveler : des amendes restent impayées');
    }

    const settings = await SettingsRepository.get();
    const newDueDate = addDays(borrow.dueDate, settings.borrowDurationDays);

    return BorrowRepository.update(borrowId, {
      dueDate: newDueDate,
      renewalCount: { increment: 1 },
    } as never);
  }

  /**
   * Transforme une réservation à l'état AVAILABLE en emprunt effectif.
   * L'exemplaire concerné est déjà à l'état RESERVED (posé par ReservationService.offerNextReservation).
   */
  static async createFromReservation(reservationId: string, processedById?: string) {
    const reservation = await ReservationRepository.findById(reservationId);
    if (!reservation) throw ApiError.notFound('Réservation introuvable');
    if (reservation.status !== 'AVAILABLE') {
      throw ApiError.conflict('Cette réservation n’est pas prête à être récupérée');
    }

    const heldCopy = await BookCopyRepository.findByStatusForBook(reservation.bookId, 'RESERVED');
    if (!heldCopy) {
      throw ApiError.conflict('Aucun exemplaire réservé trouvé pour ce livre (incohérence de données)');
    }

    const settings = await SettingsRepository.get();
    const dueDate = addDays(new Date(), settings.borrowDurationDays);

    const borrow = await BorrowRepository.create({
      member: { connect: { id: reservation.memberId } },
      bookCopy: { connect: { id: heldCopy.id } },
      dueDate,
      ...(processedById ? { processedBy: { connect: { id: processedById } } } : {}),
    });

    await BookCopyRepository.update(heldCopy.id, { status: 'BORROWED' });
    await BookRepository.recalculateCopyCounts(reservation.bookId);
    await ReservationRepository.update(reservationId, { status: 'FULFILLED' });

    await AuditService.record(AuditAction.CREATE, {
      userId: processedById,
      entityType: 'Borrow',
      entityId: borrow.id,
      metadata: { fromReservation: reservationId },
    });

    return borrow;
  }

  static async markLost(borrowId: string, processedById?: string) {
    const borrow = await this.getById(borrowId);
    if (!['ONGOING', 'LATE'].includes(borrow.status)) {
      throw ApiError.conflict('Seul un emprunt en cours peut être déclaré perdu');
    }

    const updated = await BorrowRepository.update(borrowId, {
      status: BorrowStatus.LOST,
      returnDate: new Date(),
      ...(processedById ? { processedBy: { connect: { id: processedById } } } : {}),
    });

    await BookCopyRepository.update(borrow.bookCopyId, { status: 'LOST' });
    await BookRepository.recalculateCopyCounts(borrow.bookCopy.bookId);

    const replacementCost = borrow.bookCopy.book.price ? Number(borrow.bookCopy.book.price) : 0;
    let fine = null;
    if (replacementCost > 0) {
      fine = await FineRepository.create({
        borrow: { connect: { id: borrowId } },
        member: { connect: { id: borrow.memberId } },
        amount: replacementCost,
        reason: 'Livre perdu — coût de remplacement',
        status: FineStatus.UNPAID,
      });
    }

    await AuditService.record(AuditAction.UPDATE, {
      userId: processedById,
      entityType: 'Borrow',
      entityId: borrowId,
      metadata: { action: 'lost' },
    });

    return { borrow: updated, fine };
  }

  /** À appeler périodiquement (cron / tâche planifiée — voir Étape Bonus WebSockets/Tâches planifiées). */
  static async markOverdueBatch() {
    const result = await BorrowRepository.markOverdue();

    const overdue = await BorrowRepository.findOverdueForNotification();
    for (const borrow of overdue) {
      const daysLate = computeLateDays(borrow.dueDate, new Date());
      await EmailService.sendOverdueReminderEmail(
        borrow.member.user.email,
        borrow.member.user.firstName,
        borrow.bookCopy.book.title,
        daysLate
      );
    }

    return result;
  }
}
