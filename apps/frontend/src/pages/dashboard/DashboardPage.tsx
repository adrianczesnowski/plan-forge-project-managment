import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { useCurrentOrganization } from '@/entities/organization/hooks/use-current-organization';

export function DashboardPage() {
  const { t, i18n } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const { data: organization } = useCurrentOrganization();

  const today = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'full' }).format(new Date());

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {t('welcome', { name: user?.firstName ?? '' })}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {today} · {organization?.name}
      </p>
    </div>
  );
}
