import { apiClient } from './apiClient';
import type { ApiSuccessResponse, MemberPortal } from '@/types';

export const memberPortalService = {
  async get(): Promise<MemberPortal> {
    const response = await apiClient.get<ApiSuccessResponse<MemberPortal>>('/auth/member-portal');
    return response.data.data;
  },
};
