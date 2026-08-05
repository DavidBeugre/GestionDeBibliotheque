import { apiClient } from './apiClient';
import type { ApiSuccessResponse, Borrow, PaginationMeta, Reservation } from '@/types';

export interface ReservationListParams {
  page?: number;
  limit?: number;
  memberId?: string;
  status?: string;
}

export const reservationService = {
  async list(params: ReservationListParams): Promise<{ items: Reservation[]; meta: PaginationMeta }> {
    const res = await apiClient.get<ApiSuccessResponse<Reservation[]>>('/reservations', { params });
    return { items: res.data.data, meta: res.data.pagination! };
  },

  async create(payload: { memberId: string; bookId: string }): Promise<Reservation> {
    const res = await apiClient.post<ApiSuccessResponse<Reservation>>('/reservations', payload);
    return res.data.data;
  },

  async cancel(id: string): Promise<void> {
    await apiClient.post(`/reservations/${id}/cancel`);
  },

  async fulfill(id: string): Promise<Borrow> {
    const res = await apiClient.post<ApiSuccessResponse<Borrow>>(`/reservations/${id}/fulfill`);
    return res.data.data;
  },
};
