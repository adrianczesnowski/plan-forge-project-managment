import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import type { MemberRole } from '../model/roles';

/** Shared colour map for the role names used across org / space / project levels. */
const ROLE_STYLES: Record<MemberRole, string> = {
  OWNER: 'bg-accent-purple/10 text-accent-purple',
  ADMIN: 'bg-accent-blue/10 text-accent-blue',
  MEMBER: 'bg-muted text-muted-foreground',
  VIEWER: 'bg-muted text-faint',
};

export function RoleBadge({ role, className }: { role: MemberRole; className?: string }) {
  const { t } = useTranslation('members');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-semibold',
        ROLE_STYLES[role],
        className,
      )}
    >
      {t(`roles.${role}`)}
    </span>
  );
}
