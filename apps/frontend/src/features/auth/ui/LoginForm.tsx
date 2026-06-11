import { useState, type FormEvent } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { loginSchema } from '@planforge/shared';
import { Button } from '@/shared/ui/button';
import { IconInput } from '@/shared/ui/icon-input';
import { PasswordInput } from '@/shared/ui/password-input';
import { FormField } from '@/shared/ui/form-field';
import { Checkbox } from '@/shared/ui/checkbox';
import { validateForm, type FieldErrors } from '@/shared/lib/forms';
import { translateApiError } from '@/shared/lib/api-error';
import { useLogin } from '../hooks/use-auth';

export function LoginForm() {
  const { t } = useTranslation('auth');
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});

  const fieldError = (field: string) => {
    if (!errors[field]) return undefined;
    return field === 'email' ? t('validation.emailInvalid') : t('validation.passwordRequired');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const { data, errors: validationErrors } = validateForm(loginSchema, {
      email,
      password,
      rememberMe,
    });
    setErrors(validationErrors);
    if (data) login.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
      <div className="mb-5 animate-fade-in-up [animation-delay:0.25s]">
        <FormField label={t('fields.email')} htmlFor="email" error={fieldError('email')}>
          <IconInput
            id="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder={t('login.emailPlaceholder')}
            value={email}
            error={Boolean(errors.email)}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
      </div>

      <div className="mb-5 animate-fade-in-up [animation-delay:0.3s]">
        <FormField label={t('fields.password')} htmlFor="password" error={fieldError('password')}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder={t('login.passwordPlaceholder')}
            value={password}
            error={Boolean(errors.password)}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
      </div>

      <label className="mb-7 flex animate-fade-in-up cursor-pointer items-center gap-2 [animation-delay:0.35s]">
        <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
        <span className="text-[13px] text-muted-foreground">{t('login.rememberMe')}</span>
      </label>

      {login.isError && (
        <p className="mb-4 text-sm text-destructive">{translateApiError(login.error)}</p>
      )}

      <Button
        type="submit"
        size="lg"
        isLoading={login.isPending}
        className="animate-fade-in-up [animation-delay:0.4s]"
      >
        {t('login.submit')}
        {!login.isPending && <ArrowRight className="h-4 w-4" strokeWidth={2.5} />}
      </Button>
    </form>
  );
}
