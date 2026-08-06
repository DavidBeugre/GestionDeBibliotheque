import { apiClient } from './apiClient';
import type { ApiSuccessResponse, Book, BookCopy, PaginationMeta } from '@/types';

export interface BookListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  publisherId?: string;
  authorId?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface BookFormValues {
  title: string;
  subtitle?: string;
  isbn?: string;
  summary?: string;
  description?: string;
  categoryId?: string;
  publisherId?: string;
  authorIds?: string[];
  year?: number;
  pageCount?: number;
  language?: string;
  callNumber?: string;
  location?: string;
  price?: number;
}

export const bookService = {
  async list(params: BookListParams): Promise<{ items: Book[]; meta: PaginationMeta }> {
    const res = await apiClient.get<ApiSuccessResponse<Book[]>>('/books', { params });
    return { items: res.data.data, meta: res.data.pagination! };
  },

  async getById(id: string): Promise<Book> {
    const res = await apiClient.get<ApiSuccessResponse<Book>>(`/books/${id}`);
    return res.data.data;
  },

  async recommendations(id: string): Promise<Book[]> {
    const res = await apiClient.get<ApiSuccessResponse<Book[]>>(`/books/${id}/recommendations`);
    return res.data.data;
  },

  async create(payload: BookFormValues): Promise<Book> {
    const res = await apiClient.post<ApiSuccessResponse<Book>>('/books', payload);
    return res.data.data;
  },

  async update(id: string, payload: Partial<BookFormValues>): Promise<Book> {
    const res = await apiClient.patch<ApiSuccessResponse<Book>>(`/books/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/books/${id}`);
  },

  async uploadCover(id: string, file: File): Promise<Book> {
    const formData = new FormData();
    formData.append('cover', file);
    const res = await apiClient.post<ApiSuccessResponse<Book>>(`/books/${id}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async generateQrCode(id: string): Promise<string> {
    const res = await apiClient.get<ApiSuccessResponse<{ qrCodeUrl: string }>>(`/books/${id}/qrcode`);
    return res.data.data.qrCodeUrl;
  },

  async addCopy(id: string, payload: { inventoryNumber?: string; location?: string }): Promise<BookCopy> {
    const res = await apiClient.post<ApiSuccessResponse<BookCopy>>(`/books/${id}/copies`, payload);
    return res.data.data;
  },

  async updateCopy(id: string, copyId: string, payload: Partial<{ status: string; condition: string; location: string }>): Promise<BookCopy> {
    const res = await apiClient.patch<ApiSuccessResponse<BookCopy>>(`/books/${id}/copies/${copyId}`, payload);
    return res.data.data;
  },

  async removeCopy(id: string, copyId: string): Promise<void> {
    await apiClient.delete(`/books/${id}/copies/${copyId}`);
  },
};
