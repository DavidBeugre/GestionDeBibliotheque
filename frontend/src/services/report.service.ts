import { apiClient } from './apiClient';
import type { ApiSuccessResponse } from '@/types';

export type ReportType =
  | 'popular-books'
  | 'never-borrowed'
  | 'overdue'
  | 'fines'
  | 'active-members'
  | 'daily-activity'
  | 'annual-stats';

export interface ReportColumn {
  key: string;
  label: string;
}

export type ReportRow = Record<string, string | number | null | undefined>;

export interface ReportData {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  summary?: Record<string, number>;
}

export const reportService = {
  async getData(type: ReportType, params: Record<string, string | number | undefined> = {}): Promise<ReportData> {
    const res = await apiClient.get<ApiSuccessResponse<ReportData>>(`/reports/${type}`, { params });
    return res.data.data;
  },

  async downloadExport(
    type: ReportType,
    format: 'csv' | 'excel' | 'pdf',
    params: Record<string, string | number | undefined> = {}
  ): Promise<void> {
    const res = await apiClient.get(`/reports/${type}/export`, {
      params: { ...params, format },
      responseType: 'blob',
    });

    const extension = format === 'excel' ? 'xlsx' : format;
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
