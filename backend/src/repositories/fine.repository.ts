import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

const fineInclude = {
  member: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
  borrow: { include: { bookCopy: { include: { book: true } } } },
  payments: true,
} satisfies Prisma.FineInclude;

export class FineRepository {
  static async findMany(where: Prisma.FineWhereInput, skip: number, take: number, sort: string, order: 'asc' | 'desc') {
    const [items, total] = await Promise.all([
      prisma.fine.findMany({ where, skip, take, orderBy: { [sort]: order }, include: fineInclude }),
      prisma.fine.count({ where }),
    ]);
    return { items, total };
  }

  static findById(id: string) {
    return prisma.fine.findUnique({ where: { id }, include: fineInclude });
  }

  static findByBorrowId(borrowId: string) {
    return prisma.fine.findUnique({ where: { borrowId } });
  }

  static create(data: Prisma.FineCreateInput) {
    return prisma.fine.create({ data, include: fineInclude });
  }

  static update(id: string, data: Prisma.FineUpdateInput) {
    return prisma.fine.update({ where: { id }, data, include: fineInclude });
  }

  static countUnpaidForMember(memberId: string) {
    return prisma.fine.count({ where: { memberId, status: { in: ['UNPAID', 'PARTIALLY_PAID'] } } });
  }
}
