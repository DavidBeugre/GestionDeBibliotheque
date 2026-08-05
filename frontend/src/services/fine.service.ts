import { apiClient } from './apiClient';
import type { ApiSuccessResponse, Fine, PaginationMeta } from '@/types';

export interface FineListParams {
  page?: number;
  limit?: number;
  memberId?: string;
  status?: string;
}

export const fineService = {
  async list(params: FineListParams): Promise<{ items: Fine[]; meta: PaginationMeta }> {
    const res = await apiClient.get<ApiSuccessResponse<Fine[]>>('/fines', { params });
    return { items: res.data.data, meta: res.data.pagination! };
  },

  async waive(id: string, reason: string): Promise<Fine> {
    const res = await apiClient.post<ApiSuccessResponse<Fine>>(`/fines/${id}/waive`, { reason });
    return res.data.data;
  },
};

export interface CreatePaymentPayload {
  fineId: string;
  amount: number;
  method: string;
  reference?: string;
}

export const paymentService = {
  async create(payload: CreatePaymentPayload) {
    const res = await apiClient.post<ApiSuccessResponse<unknown>>('/payments', payload);
    return res.data.data;
  },
};
