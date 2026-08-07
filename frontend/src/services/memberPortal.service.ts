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
};
