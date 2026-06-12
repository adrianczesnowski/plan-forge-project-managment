import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProject } from '@/entities/project/hooks/use-projects';
import { ProjectStatusBadge } from '@/entities/project/ui/ProjectStatusBadge';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';
import { cn } from '@/shared/lib/utils';
import { useState } from 'react';
import { ProjectOverviewTab } from './tabs/ProjectOverviewTab';
import { WbsTab } from './tabs/wbs/WbsTab';

const TABS = ['overview', 'wbs', 'kanban', 'gantt', 'table'] as const;
type ProjectTab = (typeof TABS)[number];

/** Kanban/Gantt/Table arrive in phase 2 of the roadmap. */
const IMPLEMENTED_TABS: ProjectTab[] = ['overview', 'wbs'];

export function ProjectPage() {
  const { t } = useTranslation('projects');
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isPending } = useProject(projectId);
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview');

  if (isPending) return <FullPageSpinner />;
  if (!project) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 pt-5">
        <div className="mb-3 flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
          <ProjectStatusBadge status={project.status} />
        </div>

        <div className="flex gap-1">
          {TABS.map((tab) => {
            const implemented = IMPLEMENTED_TABS.includes(tab);
            return (
              <button
                key={tab}
                type="button"
                disabled={!implemented}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'border-b-2 px-3 pb-2.5 pt-1 text-[13.5px] font-medium transition-colors',
                  activeTab === tab
                    ? 'border-primary font-semibold text-foreground'
                    : 'border-transparent text-muted-foreground',
                  implemented ? 'hover:text-foreground' : 'cursor-not-allowed opacity-50',
                )}
              >
                {t(`tabs.${tab}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && <ProjectOverviewTab project={project} />}
        {activeTab === 'wbs' && <WbsTab project={project} />}
      </div>
    </div>
  );
}
