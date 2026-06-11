import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

/** 0–4: length ≥ 8, uppercase, digit, special character. */
export function scorePassword(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const LABEL_KEYS = ['weak', 'weak', 'medium', 'good', 'strong'] as const;

const BAR_COLORS = [
  '',
  'bg-accent-orange',
  'bg-accent-orange',
  'bg-accent-orange',
  'bg-accent-green',
] as const;

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation('auth');
  const score = scorePassword(password);
  const labelKey = LABEL_KEYS[score] ?? 'weak';

  return (
    <div>
      <div className="mt-2 flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              'h-1 flex-1 rounded-sm bg-border-light transition-colors duration-300',
              index < score && BAR_COLORS[score],
            )}
          />
        ))}
      </div>
      <div className="mt-1 min-h-4 text-[11.5px] text-faint">
        {password.length > 0 && score > 0 ? t(`strength.${labelKey}`) : ''}
      </div>
    </div>
  );
}
