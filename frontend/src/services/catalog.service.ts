import { apiClient } from './apiClient';
import type { ApiSuccessResponse, Author, Category, Publisher } from '@/types';

export const catalogService = {
  async listCategories(): Promise<Category[]> {
    const res = await apiClient.get<ApiSuccessResponse<Category[]>>('/categories', { params: { limit: 100 } });
    return res.data.data;
  },
  async createCategory(payload: { name: string; description?: string; color?: string }): Promise<Category> {
    const res = await apiClient.post<ApiSuccessResponse<Category>>('/categories', payload);
    return res.data.data;
  },

  async listPublishers(): Promise<Publisher[]> {
    const res = await apiClient.get<ApiSuccessResponse<Publisher[]>>('/publishers', { params: { limit: 100 } });
    return res.data.data;
  },
  async createPublisher(payload: { name: string; country?: string }): Promise<Publisher> {
    const res = await apiClient.post<ApiSuccessResponse<Publisher>>('/publishers', payload);
    return res.data.data;
  },

  async listAuthors(search?: string): Promise<Author[]> {
    const res = await apiClient.get<ApiSuccessResponse<Author[]>>('/authors', { params: { limit: 100, search } });
    return res.data.data;
  },
  async createAuthor(payload: { name: string; nationality?: string }): Promise<Author> {
    const res = await apiClient.post<ApiSuccessResponse<Author>>('/authors', payload);
    return res.data.data;
  },
};
