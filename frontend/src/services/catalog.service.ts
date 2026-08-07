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
  async updateCategory(id: string, payload: { name?: string; description?: string; color?: string }): Promise<Category> {
    const res = await apiClient.patch<ApiSuccessResponse<Category>>(`/categories/${id}`, payload);
    return res.data.data;
  },
  async removeCategory(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },

  async listPublishers(): Promise<Publisher[]> {
    const res = await apiClient.get<ApiSuccessResponse<Publisher[]>>('/publishers', { params: { limit: 100 } });
    return res.data.data;
  },
  async createPublisher(payload: { name: string; country?: string }): Promise<Publisher> {
    const res = await apiClient.post<ApiSuccessResponse<Publisher>>('/publishers', payload);
    return res.data.data;
  },
  async updatePublisher(id: string, payload: { name?: string; country?: string }): Promise<Publisher> {
    const res = await apiClient.patch<ApiSuccessResponse<Publisher>>(`/publishers/${id}`, payload);
    return res.data.data;
  },
  async removePublisher(id: string): Promise<void> {
    await apiClient.delete(`/publishers/${id}`);
  },

  async listAuthors(search?: string): Promise<Author[]> {
    const res = await apiClient.get<ApiSuccessResponse<Author[]>>('/authors', { params: { limit: 100, search } });
    return res.data.data;
  },
  async createAuthor(payload: { name: string; nationality?: string }): Promise<Author> {
    const res = await apiClient.post<ApiSuccessResponse<Author>>('/authors', payload);
    return res.data.data;
  },
  async updateAuthor(id: string, payload: { name?: string; nationality?: string }): Promise<Author> {
    const res = await apiClient.patch<ApiSuccessResponse<Author>>(`/authors/${id}`, payload);
    return res.data.data;
  },
  async removeAuthor(id: string): Promise<void> {
    await apiClient.delete(`/authors/${id}`);
  },
  async uploadAuthorPhoto(id: string, file: File): Promise<Author> {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await apiClient.post<ApiSuccessResponse<Author>>(`/authors/${id}/photo`, formData);
    return res.data.data;
  },
};
