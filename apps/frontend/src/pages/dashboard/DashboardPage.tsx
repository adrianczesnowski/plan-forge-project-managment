import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/shared/ui/button';
import { useLogout } from '@/features/auth/hooks/use-auth';

export function DashboardPage() {
  const { t } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">
        {t('welcome', { name: user?.firstName ?? '' })}
      </h1>
      <p className="text-muted-foreground">{t('dashboard')}</p>
      <Button variant="outline" onClick={() => logout.mutate()} isLoading={logout.isPending}>
        {t('logout')}
      </Button>
    </div>
  );
}
