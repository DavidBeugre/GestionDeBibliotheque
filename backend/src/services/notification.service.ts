import { NotificationRepository } from '../repositories/notification.repository';
import { ApiError } from '../utils/ApiError';
import { PaginationParams, buildPaginationMeta } from '../utils/pagination.util';

export class NotificationService {
  static async list(userId: string, pagination: PaginationParams, isRead?: boolean) {
    const { items, total } = await NotificationRepository.findManyForUser(
      userId,
      isRead,
      pagination.skip,
      pagination.limit
    );
    return { items, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  static unreadCount(userId: string) {
    return NotificationRepository.countUnread(userId);
  }

  static async markRead(id: string, userId: string) {
    const notification = await this.assertOwnership(id, userId);
    return NotificationRepository.markRead(notification.id);
  }

  static markAllRead(userId: string) {
    return NotificationRepository.markAllRead(userId);
  }

  static async remove(id: string, userId: string): Promise<void> {
    const notification = await this.assertOwnership(id, userId);
    await NotificationRepository.delete(notification.id);
  }

  private static async assertOwnership(id: string, userId: string) {
    const notification = await NotificationRepository.findById(id);
    if (!notification) throw ApiError.notFound('Notification introuvable');
    if (notification.userId !== userId) {
      // On renvoie 404 plutôt que 403 pour ne pas confirmer l'existence d'une notification d'autrui.
      throw ApiError.notFound('Notification introuvable');
    }
    return notification;
  }
}
