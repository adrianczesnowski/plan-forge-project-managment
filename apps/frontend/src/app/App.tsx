import { RouterProvider } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { refreshSession } from '@/shared/lib/api-client';
import { useEffect } from 'react';
import { router } from './router';

/**
 * Session bootstrap. refreshSession() is single-flight, so StrictMode's
 * double-effect shares one request — crucial because refresh tokens rotate
 * and a duplicate call would invalidate the first one.
 */
export function App() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    refreshSession().catch(() => clearAuth());
  }, [clearAuth]);

  return <RouterProvider router={router} />;
}
