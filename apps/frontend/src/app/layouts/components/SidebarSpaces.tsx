import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSpaces } from '@/entities/space/hooks/use-spaces';
import { useCurrentOrganization } from '@/entities/organization/hooks/use-current-organization';
import { CreateSpaceDialog } from '@/features/space/ui/CreateSpaceDialog';
import { SidebarSpaceItem } from './SidebarSpaceItem';

export function SidebarSpaces() {
  const { t } = useTranslation('spaces');
  const { data: spaces } = useSpaces();
  const { data: organization } = useCurrentOrganization();
  const [isCreateOpen, setCreateOpen] = useState(false);

  const canCreate = organization?.myRole === 'OWNER' || organization?.myRole === 'ADMIN';

  return (
    <>
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          {t('sectionTitle')}
        </span>
        {canCreate && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-5 w-5 items-center justify-center rounded text-faint transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-0.5 px-2">
        {spaces?.map((space) => <SidebarSpaceItem key={space.id} space={space} />)}
        {spaces?.length === 0 && (
          <p className="px-2.5 py-1.5 text-xs text-faint">
            {canCreate ? t('emptyHintAdmin') : t('emptyHintMember')}
          </p>
        )}
      </div>

      <CreateSpaceDialog open={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
