import { RouterProvider } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/features/auth/api/auth.api';
import { useEffect } from 'react';
import { router } from './router';

/**
 * Session bootstrap lives here (not in a hook used by routes) so it runs
 * exactly once, before the router decides between guest and protected trees.
 */
export function App() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    authApi
      .refresh()
      .then(({ user, accessToken }) => setAuth(user, accessToken))
      .catch(() => clearAuth());
  }, [setAuth, clearAuth]);

  return <RouterProvider router={router} />;
}
