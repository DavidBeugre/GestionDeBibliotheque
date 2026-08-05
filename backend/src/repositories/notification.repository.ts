import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class NotificationRepository {
  static async findManyForUser(userId: string, isRead: boolean | undefined, skip: number, take: number) {
    const where: Prisma.NotificationWhereInput = { userId, ...(isRead !== undefined ? { isRead } : {}) };
    const [items, total] = await Promise.all([
      prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
    ]);
    return { items, total };
  }

  static findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  }

  static countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  static markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  static markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }

  static delete(id: string) {
    return prisma.notification.delete({ where: { id } });
  }
}
