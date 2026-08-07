import { apiClient, setAccessToken } from './apiClient';
import type { ApiSuccessResponse, AuthUser } from '@/types';

interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await apiClient.post<ApiSuccessResponse<AuthResult>>('/auth/login', { email, password });
    setAccessToken(res.data.data.accessToken);
    return res.data.data.user;
  },

  async register(payload: { email: string; password: string; firstName: string; lastName: string }): Promise<AuthUser> {
    const res = await apiClient.post<ApiSuccessResponse<AuthResult>>('/auth/register', payload);
    setAccessToken(res.data.data.accessToken);
    return res.data.data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout').catch(() => undefined);
    setAccessToken(null);
  },

  async me(): Promise<AuthUser> {
    const res = await apiClient.get<ApiSuccessResponse<AuthUser>>('/auth/me');
    return res.data.data;
  },

  async updateProfile(payload: { firstName: string; lastName: string; email: string }): Promise<AuthUser> {
    const res = await apiClient.patch<ApiSuccessResponse<AuthUser>>('/auth/me', payload);
    return res.data.data;
  },

  async refresh(): Promise<{ user: AuthUser; accessToken: string } | null> {
    try {
      const res = await apiClient.post<ApiSuccessResponse<AuthResult>>('/auth/refresh-token');
      setAccessToken(res.data.data.accessToken);
      return res.data.data;
    } catch {
      return null;
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', { oldPassword, newPassword });
  },
};
