import type { AuthResponse, LoginInput, RegisterInput, User } from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const authApi = {
  register: (input: RegisterInput) =>
    apiClient.post<never>('/auth/register', input).then((res) => unwrap<AuthResponse>(res)),

  login: (input: LoginInput) =>
    apiClient.post<never>('/auth/login', input).then((res) => unwrap<AuthResponse>(res)),

  logout: () => apiClient.post('/auth/logout').then(() => undefined),

  refresh: () =>
    apiClient.post<never>('/auth/refresh').then((res) => unwrap<AuthResponse>(res)),

  getMe: () => apiClient.get<never>('/auth/me').then((res) => unwrap<User>(res)),
};
