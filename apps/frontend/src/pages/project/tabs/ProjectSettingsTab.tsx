import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProjectWithRole } from '@planforge/shared';
import { SettingsSubnav, type SubnavItem } from '@/features/settings/ui/SettingsSubnav';
import { VisibilityGeneralPanel } from '@/features/visibility/ui/VisibilityGeneralPanel';
import { ProjectMembersPanel } from './ProjectMembersPanel';

type Section = 'general' | 'members';

export function ProjectSettingsTab({ project }: { project: ProjectWithRole }) {
  const { t } = useTranslation('settings');
  const [section, setSection] = useState<Section>('general');

  const items: SubnavItem<Section>[] = [
    { key: 'general', label: t('sections.general') },
    { key: 'members', label: t('sections.members') },
  ];

  return (
    <div className="space-y-5 px-6 py-5">
      <SettingsSubnav items={items} active={section} onChange={setSection} />
      {section === 'general' ? (
        <VisibilityGeneralPanel entityType="PROJECT" entityId={project.id} hidden={project.hidden} />
      ) : (
        <ProjectMembersPanel project={project} />
      )}
    </div>
  );
}
