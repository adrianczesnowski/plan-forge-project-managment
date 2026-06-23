import { useTranslation } from 'react-i18next';
import { OrganizationMembersSection } from '@/features/member/ui/OrganizationMembersSection';

export function SettingsPage() {
  const { t } = useTranslation('settings');

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h1 className="text-xl font-bold tracking-tight">{t('title')}</h1>

      <section className="mt-6">
        <div className="mb-3">
          <h2 className="text-[15px] font-semibold">{t('orgMembers.title')}</h2>
          <p className="text-[13px] text-muted-foreground">{t('orgMembers.subtitle')}</p>
        </div>
        <OrganizationMembersSection />
      </section>
    </div>
  );
}
