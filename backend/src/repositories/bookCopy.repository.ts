import { CopyStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class BookCopyRepository {
  static findById(id: string) {
    return prisma.bookCopy.findUnique({ where: { id }, include: { book: true } });
  }

  static findByStatusForBook(bookId: string, status: CopyStatus) {
    return prisma.bookCopy.findFirst({ where: { bookId, status } });
  }

  static findByInventoryNumber(inventoryNumber: string) {
    return prisma.bookCopy.findUnique({ where: { inventoryNumber } });
  }

  static listForBook(bookId: string) {
    return prisma.bookCopy.findMany({ where: { bookId }, orderBy: { inventoryNumber: 'asc' } });
  }

  static create(data: Prisma.BookCopyCreateInput) {
    return prisma.bookCopy.create({ data });
  }

  static update(id: string, data: Prisma.BookCopyUpdateInput) {
    return prisma.bookCopy.update({ where: { id }, data });
  }

  static delete(id: string) {
    return prisma.bookCopy.delete({ where: { id } });
  }

  static countActiveBorrowsForCopy(copyId: string) {
    return prisma.borrow.count({ where: { bookCopyId: copyId, status: { in: ['ONGOING', 'LATE'] } } });
  }

  static async generateNextInventoryNumber(): Promise<string> {
    const count = await prisma.bookCopy.count();
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }

  static isBorrowableStatus(status: CopyStatus): boolean {
    return status === 'AVAILABLE';
  }
}
