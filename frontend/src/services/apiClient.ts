import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants';
import type { ApiSuccessResponse } from '@/types';

// Le refresh token vit dans un cookie httpOnly (posé par le backend) : le frontend ne le
// manipule jamais directement. Seul l'access token est gardé ici, en mémoire uniquement
// (jamais localStorage/sessionStorage) pour limiter l'exposition en cas de faille XSS.
let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;
const ACCESS_TOKEN_STORAGE_KEY = 'shelfly_access_token';

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (typeof window === 'undefined') return;

  if (token) {
    window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } else {
    window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** Restaure le jeton de l'onglet courant si les cookies cross-site sont bloqués. */
export function restoreAccessToken(): string | null {
  if (accessToken || typeof window === 'undefined') return accessToken;
  accessToken = window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  return accessToken;
}

/** Enregistré par AuthContext au démarrage : appelé quand la session ne peut plus être renouvelée. */
export function registerSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // envoie le cookie httpOnly du refresh token
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post<ApiSuccessResponse<{ accessToken: string }>>(
      `${API_BASE_URL}/auth/refresh-token`,
      {},
      { withCredentials: true }
    );
    const newToken = response.data.data.accessToken;
    setAccessToken(newToken);
    return newToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const isAuthRoute = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh-token');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      const newToken = await refreshPromise;

      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }

      onSessionExpired?.();
    }

    return Promise.reject(error);
  }
);
