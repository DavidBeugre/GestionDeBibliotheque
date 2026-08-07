import { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types';

export function getApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    const details = (data as ApiErrorResponse & { details?: Array<{ field?: string; message?: string }> })?.details;
    if (details?.length) return details.map((detail) => `${detail.field ? `${detail.field} : ` : ''}${detail.message ?? 'Valeur invalide'}`).join(' · ');
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
