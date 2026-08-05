import { apiClient } from './apiClient';
import type { ActivityLogEntry, ApiSuccessResponse, DashboardStats } from '@/types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await apiClient.get<ApiSuccessResponse<DashboardStats>>('/dashboard/stats');
    return res.data.data;
  },

  async getRecentActivity(limit = 10): Promise<ActivityLogEntry[]> {
    const res = await apiClient.get<ApiSuccessResponse<ActivityLogEntry[]>>('/activity-logs/recent', {
      params: { limit },
    });
    return res.data.data;
  },
};
