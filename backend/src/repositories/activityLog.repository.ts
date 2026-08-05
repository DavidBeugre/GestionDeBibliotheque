import { prisma } from '../config/database';

export class ActivityLogRepository {
  static create(data: { userId?: string; action: string; entityType?: string; entityId?: string; description: string }) {
    return prisma.activityLog.create({ data });
  }

  static async findRecent(limit: number) {
    return prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }
}
