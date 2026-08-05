import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class AuditLogRepository {
  static async findMany(filters: AuditLogFilters, skip: number, take: number, sort: string, order: 'asc' | 'desc') {
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { [sort]: order },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  }

  static findById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }
}
