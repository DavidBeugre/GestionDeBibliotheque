import { BookStatus, Prisma } from '@prisma/client';

export interface BookFilters {
  search?: string;
  categoryId?: string;
  publisherId?: string;
  authorId?: string;
  status?: BookStatus;
  language?: string;
  yearFrom?: number;
  yearTo?: number;
  tag?: string;
}

export function buildBookWhereClause(filters: BookFilters): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = {};

  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.publisherId) where.publisherId = filters.publisherId;
  if (filters.status) where.status = filters.status;
  if (filters.language) where.language = filters.language;
  if (filters.tag) where.tags = { has: filters.tag };

  if (filters.authorId) {
    where.authors = { some: { authorId: filters.authorId } };
  }

  if (filters.yearFrom || filters.yearTo) {
    where.year = {
      ...(filters.yearFrom ? { gte: filters.yearFrom } : {}),
      ...(filters.yearTo ? { lte: filters.yearTo } : {}),
    };
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim();
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { subtitle: { contains: search, mode: 'insensitive' } },
      { isbn: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
      { callNumber: { contains: search, mode: 'insensitive' } },
      { authors: { some: { author: { name: { contains: search, mode: 'insensitive' } } } } },
    ];
  }

  return where;
}
