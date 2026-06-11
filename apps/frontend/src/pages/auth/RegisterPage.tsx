import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RegisterForm } from '@/features/auth/ui/RegisterForm';
import { BrandFeatureList } from '@/features/auth/ui/brand/BrandFeatureList';
import { AuthLayout } from './AuthLayout';

export function RegisterPage() {
  const { t } = useTranslation('auth');

  return (
    <AuthLayout
      brand={{
        headline: t('brand.registerHeadline'),
        headlineAccent: t('brand.registerHeadlineAccent'),
        subtext: t('brand.registerSubtext'),
        content: <BrandFeatureList />,
      }}
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={
        <>
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
            {t('register.loginLink')}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
