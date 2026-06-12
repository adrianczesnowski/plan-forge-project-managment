import { Mail, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconInput } from '@/shared/ui/icon-input';

export interface InviteRowValue {
  email: string;
  role: 'MEMBER' | 'ADMIN';
}

interface InviteRowProps {
  value: InviteRowValue;
  onChange: (value: InviteRowValue) => void;
  onRemove?: () => void;
}

export function InviteRow({ value, onChange, onRemove }: InviteRowProps) {
  const { t } = useTranslation('onboarding');

  return (
    <div className="flex items-center gap-2">
      <IconInput
        icon={Mail}
        type="email"
        placeholder={t('create.emailPlaceholder')}
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        className="flex-1"
      />
      <select
        value={value.role}
        onChange={(e) => onChange({ ...value, role: e.target.value as InviteRowValue['role'] })}
        className="h-[42px] cursor-pointer appearance-none rounded-[10px] border border-border bg-white px-3 pr-8 text-[13px] outline-none focus:border-primary"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
        }}
      >
        <option value="MEMBER">{t('roles.MEMBER')}</option>
        <option value="ADMIN">{t('roles.ADMIN')}</option>
      </select>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          title={t('create.removePerson')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-muted hover:text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
