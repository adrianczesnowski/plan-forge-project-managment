import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SpaceWithRole } from '@planforge/shared';
import { Dialog } from '@/shared/ui/dialog';
import { SettingsSubnav, type SubnavItem } from '@/features/settings/ui/SettingsSubnav';
import { VisibilityGeneralPanel } from '@/features/visibility/ui/VisibilityGeneralPanel';
import { SpaceMembersPanel } from '@/features/member/ui/SpaceMembersPanel';

type Section = 'general' | 'members';

interface SpaceSettingsDialogProps {
  space: SpaceWithRole;
  open: boolean;
  onClose: () => void;
}

export function SpaceSettingsDialog({ space, open, onClose }: SpaceSettingsDialogProps) {
  const { t } = useTranslation('settings');
  const [section, setSection] = useState<Section>('general');

  const items: SubnavItem<Section>[] = [
    { key: 'general', label: t('sections.general') },
    { key: 'members', label: t('sections.members') },
  ];

  return (
    <Dialog open={open} onClose={onClose} title={t('space.title', { name: space.name })}>
      <div className="space-y-4">
        <SettingsSubnav items={items} active={section} onChange={setSection} />
        {section === 'general' ? (
          <VisibilityGeneralPanel entityType="SPACE" entityId={space.id} hidden={space.hidden} />
        ) : (
          <SpaceMembersPanel space={space} />
        )}
      </div>
    </Dialog>
  );
}
