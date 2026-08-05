import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

const paymentInclude = {
  member: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
  fine: true,
  processedBy: { select: { firstName: true, lastName: true } },
} satisfies Prisma.PaymentInclude;

export class PaymentRepository {
  static async findMany(where: Prisma.PaymentWhereInput, skip: number, take: number, sort: string, order: 'asc' | 'desc') {
    const [items, total] = await Promise.all([
      prisma.payment.findMany({ where, skip, take, orderBy: { [sort]: order }, include: paymentInclude }),
      prisma.payment.count({ where }),
    ]);
    return { items, total };
  }

  static findById(id: string) {
    return prisma.payment.findUnique({ where: { id }, include: paymentInclude });
  }

  static findByFineId(fineId: string) {
    return prisma.payment.findMany({ where: { fineId } });
  }

  static create(data: Prisma.PaymentCreateInput) {
    return prisma.payment.create({ data, include: paymentInclude });
  }
}
