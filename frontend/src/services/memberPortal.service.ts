import { apiClient } from './apiClient';
import type { ApiSuccessResponse, MemberPortal } from '@/types';

export const memberPortalService = {
  async get(): Promise<MemberPortal> {
    const response = await apiClient.get<ApiSuccessResponse<MemberPortal>>('/auth/member-portal');
    return response.data.data;
  },

  async reserve(bookId: string): Promise<void> {
    await apiClient.post(`/auth/member-portal/reservations/${bookId}`);
  },

  async cancelReservation(reservationId: string): Promise<void> {
    await apiClient.delete(`/auth/member-portal/reservations/${reservationId}`);
  },

  async qrCode(): Promise<string> {
    const response = await apiClient.get<ApiSuccessResponse<{ qrCodeUrl: string }>>('/auth/member-portal/qrcode');
    return response.data.data.qrCodeUrl;
  },

  async renewBorrow(borrowId: string): Promise<void> {
    await apiClient.post(`/auth/member-portal/borrows/${borrowId}/renew`);
  },
};
