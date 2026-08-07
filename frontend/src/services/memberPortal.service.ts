import { apiClient } from './apiClient';
import type { ApiSuccessResponse, Borrow, Fine, MemberPortal, Reservation } from '@/types';

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

  async history(): Promise<{ borrows: Borrow[]; reservations: Reservation[]; fines: Fine[] }> {
    const response = await apiClient.get<ApiSuccessResponse<{ borrows: Borrow[]; reservations: Reservation[]; fines: Fine[] }>>('/auth/member-portal/history');
    return response.data.data;
  },

  async downloadCardPdf(): Promise<void> {
    const response = await apiClient.get('/auth/member-portal/card.pdf', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data as Blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'carte-shelfly.pdf';
    anchor.click();
    URL.revokeObjectURL(url);
  },
};
