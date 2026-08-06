import { apiClient } from './apiClient';
import type { ApiSuccessResponse, Borrow, Fine, Member, PaginationMeta, Reservation } from '@/types';

export interface MemberListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  memberType?: string;
}

export interface MemberFormValues {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  sex?: string;
  birthDate?: string;
  address?: string;
  profession?: string;
  memberType?: string;
  subscriptionExpiry?: string;
}

export interface MemberHistory {
  borrows: Borrow[];
  reservations: Reservation[];
  fines: Fine[];
}

export const memberService = {
  async list(params: MemberListParams): Promise<{ items: Member[]; meta: PaginationMeta }> {
    const res = await apiClient.get<ApiSuccessResponse<Member[]>>('/members', { params });
    return { items: res.data.data, meta: res.data.pagination! };
  },

  async getById(id: string): Promise<Member> {
    const res = await apiClient.get<ApiSuccessResponse<Member>>(`/members/${id}`);
    return res.data.data;
  },

  async create(payload: MemberFormValues): Promise<Member> {
    const res = await apiClient.post<ApiSuccessResponse<Member>>('/members', payload);
    return res.data.data;
  },

  async update(id: string, payload: Partial<MemberFormValues>): Promise<Member> {
    const res = await apiClient.patch<ApiSuccessResponse<Member>>(`/members/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/members/${id}`);
  },

  async getHistory(id: string): Promise<MemberHistory> {
    const res = await apiClient.get<ApiSuccessResponse<MemberHistory>>(`/members/${id}/history`);
    return res.data.data;
  },

  async uploadPhoto(id: string, file: File): Promise<Member> {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await apiClient.post<ApiSuccessResponse<Member>>(`/members/${id}/photo`, formData);
    return res.data.data;
  },

  async generateQrCode(id: string): Promise<string> {
    const res = await apiClient.get<ApiSuccessResponse<{ qrCodeUrl: string }>>(`/members/${id}/qrcode`);
    return res.data.data.qrCodeUrl;
  },

  async suspend(id: string): Promise<void> {
    await apiClient.post(`/members/${id}/suspend`);
  },

  async reactivate(id: string): Promise<void> {
    await apiClient.post(`/members/${id}/reactivate`);
  },
};
