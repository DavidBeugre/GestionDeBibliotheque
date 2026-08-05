import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class PublisherRepository {
  static async findMany(where: Prisma.PublisherWhereInput, skip: number, take: number, sort: string, order: 'asc' | 'desc') {
    const [items, total] = await Promise.all([
      prisma.publisher.findMany({
        where,
        skip,
        take,
        orderBy: { [sort]: order },
        include: { _count: { select: { books: true } } },
      }),
      prisma.publisher.count({ where }),
    ]);
    return { items, total };
  }

  static findById(id: string) {
    return prisma.publisher.findUnique({ where: { id }, include: { _count: { select: { books: true } } } });
  }

  static create(data: Prisma.PublisherCreateInput) {
    return prisma.publisher.create({ data });
  }

  static update(id: string, data: Prisma.PublisherUpdateInput) {
    return prisma.publisher.update({ where: { id }, data });
  }

  static delete(id: string) {
    return prisma.publisher.delete({ where: { id } });
  }

  static countBooks(publisherId: string) {
    return prisma.book.count({ where: { publisherId } });
  }
}
