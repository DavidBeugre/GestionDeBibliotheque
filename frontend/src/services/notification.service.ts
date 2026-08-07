import { apiClient } from './apiClient';
import type { ApiSuccessResponse, Notification, PaginationMeta } from '@/types';

export const notificationService = {
  async list(params: { page?: number; limit?: number } = {}): Promise<{ items: Notification[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessResponse<Notification[]>>('/notifications', { params: { page: params.page ?? 1, limit: params.limit ?? 8 } });
    return { items: response.data.data, meta: response.data.pagination! };
  },

  async unreadCount(): Promise<number> {
    const response = await apiClient.get<ApiSuccessResponse<{ count: number }>>('/notifications/unread-count');
    return response.data.data.count;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};
