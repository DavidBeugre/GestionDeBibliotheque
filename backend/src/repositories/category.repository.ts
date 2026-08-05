import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class CategoryRepository {
  static async findMany(where: Prisma.CategoryWhereInput, skip: number, take: number, sort: string, order: 'asc' | 'desc') {
    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: { [sort]: order },
        include: { _count: { select: { books: true } } },
      }),
      prisma.category.count({ where }),
    ]);
    return { items, total };
  }

  static findById(id: string) {
    return prisma.category.findUnique({ where: { id }, include: { _count: { select: { books: true } } } });
  }

  static findByName(name: string) {
    return prisma.category.findUnique({ where: { name } });
  }

  static create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  }

  static update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  }

  static delete(id: string) {
    return prisma.category.delete({ where: { id } });
  }

  static countBooks(categoryId: string) {
    return prisma.book.count({ where: { categoryId } });
  }
}
