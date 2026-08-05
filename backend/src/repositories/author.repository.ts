import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class AuthorRepository {
  static async findMany(where: Prisma.AuthorWhereInput, skip: number, take: number, sort: string, order: 'asc' | 'desc') {
    const [items, total] = await Promise.all([
      prisma.author.findMany({
        where,
        skip,
        take,
        orderBy: { [sort]: order },
        include: { _count: { select: { books: true } } },
      }),
      prisma.author.count({ where }),
    ]);
    return { items, total };
  }

  static findById(id: string) {
    return prisma.author.findUnique({
      where: { id },
      include: { books: { include: { book: true } } },
    });
  }

  static create(data: Prisma.AuthorCreateInput) {
    return prisma.author.create({ data });
  }

  static update(id: string, data: Prisma.AuthorUpdateInput) {
    return prisma.author.update({ where: { id }, data });
  }

  static delete(id: string) {
    return prisma.author.delete({ where: { id } });
  }

  static countBooks(authorId: string) {
    return prisma.bookAuthor.count({ where: { authorId } });
  }
}
