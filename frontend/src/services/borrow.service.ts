import { apiClient } from './apiClient';
import type { ApiSuccessResponse, Borrow, Fine, PaginationMeta } from '@/types';

export interface BorrowListParams {
  page?: number;
  limit?: number;
  memberId?: string;
  status?: string;
  overdue?: boolean;
}

export const borrowService = {
  async list(params: BorrowListParams): Promise<{ items: Borrow[]; meta: PaginationMeta }> {
    const res = await apiClient.get<ApiSuccessResponse<Borrow[]>>('/borrows', { params });
    return { items: res.data.data, meta: res.data.pagination! };
  },

  async create(payload: { memberId: string; bookCopyId: string }): Promise<Borrow> {
    const res = await apiClient.post<ApiSuccessResponse<Borrow>>('/borrows', payload);
    return res.data.data;
  },

  async returnBorrow(id: string): Promise<{ borrow: Borrow; fine: Fine | null }> {
    const res = await apiClient.post<ApiSuccessResponse<{ borrow: Borrow; fine: Fine | null }>>(`/borrows/${id}/return`);
    return res.data.data;
  },

  async renew(id: string): Promise<Borrow> {
    const res = await apiClient.post<ApiSuccessResponse<Borrow>>(`/borrows/${id}/renew`);
    return res.data.data;
  },

  async markLost(id: string): Promise<{ borrow: Borrow; fine: Fine | null }> {
    const res = await apiClient.post<ApiSuccessResponse<{ borrow: Borrow; fine: Fine | null }>>(`/borrows/${id}/lost`);
    return res.data.data;
  },
};
