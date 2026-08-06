import { apiClient } from './apiClient';
import type { ApiSuccessResponse, LibrarySettings } from '@/types';

export interface SettingsFormValues {
  libraryName?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  borrowDurationDays?: number;
  maxBorrowsPerUser?: number;
  finePerDay?: number;
}

export const settingsService = {
  async get(): Promise<LibrarySettings> {
    const res = await apiClient.get<ApiSuccessResponse<LibrarySettings>>('/settings');
    return res.data.data;
  },

  async update(payload: SettingsFormValues): Promise<LibrarySettings> {
    const res = await apiClient.patch<ApiSuccessResponse<LibrarySettings>>('/settings', payload);
    return res.data.data;
  },

  async updateLogo(file: File): Promise<LibrarySettings> {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await apiClient.post<ApiSuccessResponse<LibrarySettings>>('/settings/logo', formData);
    return res.data.data;
  },
};
