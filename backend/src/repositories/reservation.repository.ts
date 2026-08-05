import { Prisma, ReservationStatus } from '@prisma/client';
import { prisma } from '../config/database';

const reservationInclude = {
  member: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
  book: true,
} satisfies Prisma.ReservationInclude;

export class ReservationRepository {
  static async findMany(
    where: Prisma.ReservationWhereInput,
    skip: number,
    take: number,
    sort: string,
    order: 'asc' | 'desc'
  ) {
    const [items, total] = await Promise.all([
      prisma.reservation.findMany({ where, skip, take, orderBy: { [sort]: order }, include: reservationInclude }),
      prisma.reservation.count({ where }),
    ]);
    return { items, total };
  }

  static findById(id: string) {
    return prisma.reservation.findUnique({ where: { id }, include: reservationInclude });
  }

  static findPendingForMemberAndBook(memberId: string, bookId: string) {
    return prisma.reservation.findFirst({
      where: { memberId, bookId, status: { in: ['PENDING', 'AVAILABLE'] } },
    });
  }

  /** Plus ancienne réservation en attente pour un livre (ordre FIFO). */
  static findOldestPendingForBook(bookId: string) {
    return prisma.reservation.findFirst({
      where: { bookId, status: ReservationStatus.PENDING },
      orderBy: { reservationDate: 'asc' },
    });
  }

  static create(data: Prisma.ReservationCreateInput) {
    return prisma.reservation.create({ data, include: reservationInclude });
  }

  static update(id: string, data: Prisma.ReservationUpdateInput) {
    return prisma.reservation.update({ where: { id }, data, include: reservationInclude });
  }

  static async findExpired() {
    return prisma.reservation.findMany({
      where: { status: { in: ['PENDING', 'AVAILABLE'] }, expiryDate: { lt: new Date() } },
    });
  }
}
