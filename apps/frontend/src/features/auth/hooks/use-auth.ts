import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { AuthResponse } from '@planforge/shared';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '../api/auth.api';

function useApplyAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return (response: AuthResponse) => {
    setAuth(response.user, response.accessToken);
    navigate('/', { replace: true });
  };
}

export function useLogin() {
  const applyAuth = useApplyAuth();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: applyAuth,
  });
}

export function useRegister() {
  const applyAuth = useApplyAuth();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: applyAuth,
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}
