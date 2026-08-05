import { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types';

export function getApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
