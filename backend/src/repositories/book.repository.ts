import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

const bookInclude = {
  category: true,
  publisher: true,
  authors: { include: { author: true } },
  copies: true,
} satisfies Prisma.BookInclude;

export class BookRepository {
  static async findMany(where: Prisma.BookWhereInput, skip: number, take: number, sort: string, order: 'asc' | 'desc') {
    const [items, total] = await Promise.all([
      prisma.book.findMany({ where, skip, take, orderBy: { [sort]: order }, include: bookInclude }),
      prisma.book.count({ where }),
    ]);
    return { items, total };
  }

  static findById(id: string) {
    return prisma.book.findUnique({ where: { id }, include: bookInclude });
  }

  static findByIsbn(isbn: string) {
    return prisma.book.findUnique({ where: { isbn } });
  }

  static findRecommendations(bookId: string, categoryId: string | null, authorIds: string[]) {
    return prisma.book.findMany({
      where: {
        id: { not: bookId },
        status: 'ACTIVE',
        OR: [
          ...(categoryId ? [{ categoryId }] : []),
          ...(authorIds.length ? [{ authors: { some: { authorId: { in: authorIds } } } }] : []),
        ],
      },
      include: bookInclude,
      orderBy: [{ availableCopies: 'desc' }, { createdAt: 'desc' }],
      take: 6,
    });
  }

  static create(data: Prisma.BookCreateInput) {
    return prisma.book.create({ data, include: bookInclude });
  }

  static update(id: string, data: Prisma.BookUpdateInput) {
    return prisma.book.update({ where: { id }, data, include: bookInclude });
  }

  static archive(id: string) {
    return prisma.book.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }

  static delete(id: string) {
    return prisma.book.delete({ where: { id } });
  }

  /** Recalcule totalCopies/availableCopies depuis l'état réel des exemplaires (source de vérité). */
  static async recalculateCopyCounts(bookId: string) {
    const [totalCopies, availableCopies] = await Promise.all([
      prisma.bookCopy.count({ where: { bookId } }),
      prisma.bookCopy.count({ where: { bookId, status: 'AVAILABLE' } }),
    ]);
    return prisma.book.update({ where: { id: bookId }, data: { totalCopies, availableCopies } });
  }

  static countActiveBorrowsForBook(bookId: string) {
    return prisma.borrow.count({
      where: { bookCopy: { bookId }, status: { in: ['ONGOING', 'LATE'] } },
    });
  }
}
