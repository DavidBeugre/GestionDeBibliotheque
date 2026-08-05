import { BorrowStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

const borrowInclude = {
  member: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
  bookCopy: { include: { book: true } },
  fine: true,
} satisfies Prisma.BorrowInclude;

export class BorrowRepository {
  static async findMany(where: Prisma.BorrowWhereInput, skip: number, take: number, sort: string, order: 'asc' | 'desc') {
    const [items, total] = await Promise.all([
      prisma.borrow.findMany({ where, skip, take, orderBy: { [sort]: order }, include: borrowInclude }),
      prisma.borrow.count({ where }),
    ]);
    return { items, total };
  }

  static findById(id: string) {
    return prisma.borrow.findUnique({ where: { id }, include: borrowInclude });
  }

  static create(data: Prisma.BorrowCreateInput) {
    return prisma.borrow.create({ data, include: borrowInclude });
  }

  static update(id: string, data: Prisma.BorrowUpdateInput) {
    return prisma.borrow.update({ where: { id }, data, include: borrowInclude });
  }

  static countActiveForMember(memberId: string) {
    return prisma.borrow.count({ where: { memberId, status: { in: ['ONGOING', 'LATE'] } } });
  }

  static findActiveReservationHoldingCopyForBook(bookId: string) {
    return prisma.bookCopy.findFirst({ where: { bookId, status: 'RESERVED' } });
  }

  /** Bascule en LATE tous les emprunts en cours dont l'échéance est dépassée. */
  static async markOverdue(): Promise<{ count: number }> {
    return prisma.borrow.updateMany({
      where: { status: BorrowStatus.ONGOING, dueDate: { lt: new Date() } },
      data: { status: BorrowStatus.LATE },
    });
  }

  static findOverdueForNotification() {
    return prisma.borrow.findMany({
      where: { status: BorrowStatus.LATE },
      include: borrowInclude,
    });
  }
}
