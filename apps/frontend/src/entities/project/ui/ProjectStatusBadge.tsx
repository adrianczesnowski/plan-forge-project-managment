import { useTranslation } from 'react-i18next';
import type { ProjectStatus } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';

const STATUS_STYLES: Record<ProjectStatus, string> = {
  PLANNING: 'bg-muted text-muted-foreground',
  ACTIVE: 'bg-accent-green/10 text-accent-green',
  ON_HOLD: 'bg-accent-orange/10 text-accent-orange',
  COMPLETED: 'bg-accent-blue/10 text-accent-blue',
  ARCHIVED: 'bg-muted text-faint',
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useTranslation('projects');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-semibold',
        STATUS_STYLES[status],
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
