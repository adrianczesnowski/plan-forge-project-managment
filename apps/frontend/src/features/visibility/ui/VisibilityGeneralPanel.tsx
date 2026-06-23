import { EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FavoriteEntityType } from '@planforge/shared';
import { Switch } from '@/shared/ui/switch';
import { useToggleHidden } from '@/entities/hidden/hooks/use-hidden';

interface VisibilityGeneralPanelProps {
  entityType: FavoriteEntityType;
  entityId: string;
  /** Current hidden state, taken from the entity's per-user `hidden` flag. */
  hidden: boolean;
}

/** "General" settings section — currently the per-user hide-from-views toggle. */
export function VisibilityGeneralPanel({ entityType, entityId, hidden }: VisibilityGeneralPanelProps) {
  const { t } = useTranslation('settings');
  const { hide, unhide, isPending } = useToggleHidden();

  const scope = entityType === 'SPACE' ? t('visibility.space') : t('visibility.project');

  const toggle = (next: boolean) => {
    if (next) hide.mutate({ entityType, entityId });
    else unhide.mutate({ entityType, entityId });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <EyeOff className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium">{t('visibility.title')}</div>
          <p className="text-[12px] text-muted-foreground">{t('visibility.hint', { scope })}</p>
        </div>
        <Switch
          checked={hidden}
          disabled={isPending}
          onChange={toggle}
          aria-label={t('visibility.title')}
        />
      </div>
    </div>
  );
}
