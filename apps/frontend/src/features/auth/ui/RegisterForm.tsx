import { useState, type FormEvent } from 'react';
import { ArrowRight, Mail, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { registerSchema } from '@planforge/shared';
import { Button } from '@/shared/ui/button';
import { IconInput } from '@/shared/ui/icon-input';
import { PasswordInput } from '@/shared/ui/password-input';
import { FormField } from '@/shared/ui/form-field';
import { validateForm, type FieldErrors } from '@/shared/lib/forms';
import { translateApiError } from '@/shared/lib/api-error';
import { useRegister } from '../hooks/use-auth';
import { PasswordStrength } from './PasswordStrength';

const FIELD_ERROR_KEYS = {
  firstName: 'validation.firstNameRequired',
  lastName: 'validation.lastNameRequired',
  email: 'validation.emailInvalid',
  password: 'validation.passwordTooShort',
} as const;

type Field = keyof typeof FIELD_ERROR_KEYS;

export function RegisterForm() {
  const { t } = useTranslation('auth');
  const register = useRegister();

  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});

  const setValue = (field: Field) => (value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const fieldError = (field: Field) => (errors[field] ? t(FIELD_ERROR_KEYS[field]) : undefined);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const { data, errors: validationErrors } = validateForm(registerSchema, values);
    setErrors(validationErrors);
    if (data) register.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
      <div className="mb-[18px] flex animate-fade-in-up gap-3 [animation-delay:0.25s]">
        <div className="flex-1">
          <FormField
            label={t('fields.firstName')}
            htmlFor="firstName"
            error={fieldError('firstName')}
          >
            <IconInput
              id="firstName"
              icon={User}
              autoComplete="given-name"
              placeholder={t('register.firstNamePlaceholder')}
              value={values.firstName}
              error={Boolean(errors.firstName)}
              onChange={(e) => setValue('firstName')(e.target.value)}
            />
          </FormField>
        </div>
        <div className="flex-1">
          <FormField label={t('fields.lastName')} htmlFor="lastName" error={fieldError('lastName')}>
            <IconInput
              id="lastName"
              autoComplete="family-name"
              placeholder={t('register.lastNamePlaceholder')}
              value={values.lastName}
              error={Boolean(errors.lastName)}
              onChange={(e) => setValue('lastName')(e.target.value)}
            />
          </FormField>
        </div>
      </div>

      <div className="mb-[18px] animate-fade-in-up [animation-delay:0.3s]">
        <FormField label={t('fields.email')} htmlFor="email" error={fieldError('email')}>
          <IconInput
            id="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder={t('register.emailPlaceholder')}
            value={values.email}
            error={Boolean(errors.email)}
            onChange={(e) => setValue('email')(e.target.value)}
          />
        </FormField>
      </div>

      <div className="mb-7 animate-fade-in-up [animation-delay:0.35s]">
        <FormField label={t('fields.password')} htmlFor="password" error={fieldError('password')}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder={t('register.passwordPlaceholder')}
            value={values.password}
            error={Boolean(errors.password)}
            onChange={(e) => setValue('password')(e.target.value)}
          />
        </FormField>
        <PasswordStrength password={values.password} />
      </div>

      {register.isError && (
        <p className="mb-4 text-sm text-destructive">{translateApiError(register.error)}</p>
      )}

      <Button
        type="submit"
        size="lg"
        isLoading={register.isPending}
        className="animate-fade-in-up [animation-delay:0.4s]"
      >
        {t('register.submit')}
        {!register.isPending && <ArrowRight className="h-4 w-4" strokeWidth={2.5} />}
      </Button>
    </form>
  );
}
