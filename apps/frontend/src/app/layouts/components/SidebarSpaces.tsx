import { useState } from 'react';
import { Box, ChevronRight, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { useSpaces } from '@/entities/space/hooks/use-spaces';
import { useCurrentOrganization } from '@/entities/organization/hooks/use-current-organization';
import { CreateSpaceDialog } from '@/features/space/ui/CreateSpaceDialog';
import { SidebarSpaceItem } from './SidebarSpaceItem';

/**
 * Collapsible "Spaces" nav item — a single entry that expands to reveal the
 * organization's spaces (each of which expands further into its projects).
 */
export function SidebarSpaces() {
  const { t } = useTranslation('spaces');
  const { data: spaces } = useSpaces();
  const { data: organization } = useCurrentOrganization();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const canCreate = organization?.myRole === 'OWNER' || organization?.myRole === 'ADMIN';
  // Spaces the user hid live only under their settings, not in the navigation tree.
  const visibleSpaces = spaces?.filter((space) => !space.hidden);

  return (
    <div className="px-2 pt-1">
      <div className="group flex items-center">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Box className="h-[17px] w-[17px]" />
          <span className="flex-1 text-left">{t('sectionTitle')}</span>
          <ChevronRight
            className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-90')}
          />
        </button>
        {canCreate && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-faint opacity-0 transition-colors hover:bg-muted hover:text-foreground group-hover:opacity-100"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-0.5 flex flex-col gap-0.5 pl-2">
          {visibleSpaces?.map((space) => <SidebarSpaceItem key={space.id} space={space} />)}
          {visibleSpaces?.length === 0 && (
            <p className="px-2.5 py-1.5 text-xs text-faint">
              {canCreate ? t('emptyHintAdmin') : t('emptyHintMember')}
            </p>
          )}
        </div>
      )}

      <CreateSpaceDialog open={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
