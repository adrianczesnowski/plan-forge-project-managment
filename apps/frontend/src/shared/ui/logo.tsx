import { Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

interface LogoProps {
  className?: string;
  /** Color of the app name next to the icon. */
  textClassName?: string;
}

export function Logo({ className, textClassName }: LogoProps) {
  const { t } = useTranslation('common');

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-green">
        <Layers className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>
      <span className={cn('text-lg font-bold', textClassName)}>{t('appName')}</span>
    </div>
  );
}
