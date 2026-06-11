import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '@/features/auth/ui/LoginForm';
import { BrandPreviewCards } from '@/features/auth/ui/brand/BrandPreviewCards';
import { AuthLayout } from './AuthLayout';

export function LoginPage() {
  const { t } = useTranslation('auth');

  return (
    <AuthLayout
      brand={{
        headline: t('brand.loginHeadline'),
        headlineAccent: t('brand.loginHeadlineAccent'),
        subtext: t('brand.loginSubtext'),
        content: <BrandPreviewCards />,
      }}
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <>
          {t('login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">
            {t('login.registerLink')}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
