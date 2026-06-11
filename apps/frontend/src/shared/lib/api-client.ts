import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse, ApiSuccessResponse, AuthResponse } from '@planforge/shared';
import { useAuthStore } from '@/stores/auth.store';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/** Unwraps the `{ success, data }` envelope from a successful response. */
export function unwrap<T>(response: { data: ApiSuccessResponse<T> }): T {
  return response.data.data;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // Plain axios call — must bypass the interceptors to avoid a refresh loop.
  const response = await axios.post<ApiSuccessResponse<AuthResponse>>(
    '/api/auth/refresh',
    {},
    { withCredentials: true },
  );
  const { user, accessToken } = response.data.data;
  useAuthStore.getState().setAuth(user, accessToken);
  return accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthEndpoint = config?.url?.startsWith('/auth/') ?? false;

    if (error.response?.status !== 401 || !config || config._retried || isAuthEndpoint) {
      throw error;
    }

    config._retried = true;
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const accessToken = await refreshPromise;
      config.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient.request(config);
    } catch {
      useAuthStore.getState().clearAuth();
      throw error;
    }
  },
);
