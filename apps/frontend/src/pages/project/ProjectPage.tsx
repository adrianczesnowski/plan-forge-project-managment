import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProject } from '@/entities/project/hooks/use-projects';
import { ProjectStatusBadge } from '@/entities/project/ui/ProjectStatusBadge';
import { TaskDetailModal } from '@/features/task/ui/task-detail/TaskDetailModal';
import { TaskFiltersBar } from '@/features/task/ui/filters/TaskFiltersBar';
import { EMPTY_FILTERS, type TaskFilters } from '@/features/task/model/task-filters';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';
import { cn } from '@/shared/lib/utils';
import { useState } from 'react';
import { ProjectOverviewTab } from './tabs/ProjectOverviewTab';
import { WbsTab } from './tabs/wbs/WbsTab';
import { KanbanTab } from './tabs/kanban/KanbanTab';
import { GanttTab } from './tabs/gantt/GanttTab';
import { TableTab } from './tabs/table/TableTab';
import { ProjectSettingsTab } from './tabs/ProjectSettingsTab';
import { ProjectActionsMenu } from '@/features/project/ui/ProjectActionsMenu';
import { FavoriteStar } from '@/features/favorite/ui/FavoriteStar';
import { useProjectRealtime } from '@/shared/hooks/use-project-realtime';

const TABS = ['overview', 'wbs', 'kanban', 'gantt', 'table', 'settings'] as const;
type ProjectTab = (typeof TABS)[number];

/** Tabs that render tasks and react to the shared filters toolbar. */
const TASK_TABS: ProjectTab[] = ['wbs', 'kanban', 'gantt', 'table'];

const IMPLEMENTED_TABS: ProjectTab[] = ['overview', 'wbs', 'kanban', 'gantt', 'table', 'settings'];

export function ProjectPage() {
  const { t } = useTranslation('projects');
  const { projectId, taskId } = useParams<{ projectId: string; taskId?: string }>();
  const { data: project, isPending } = useProject(projectId);
  // Deep-linked task modal defaults the underlying view to the WBS tab.
  const [activeTab, setActiveTab] = useState<ProjectTab>(taskId ? 'wbs' : 'overview');
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);

  useProjectRealtime(projectId);

  if (isPending) return <FullPageSpinner />;
  if (!project) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 pt-5">
        <div className="mb-3 flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
          <ProjectStatusBadge status={project.status} />
          <FavoriteStar entityType="PROJECT" entityId={project.id} size={18} className="h-7 w-7" />
          <ProjectActionsMenu project={project} />
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

      {TASK_TABS.includes(activeTab) && (
        <div className="border-b border-border px-6 py-2.5">
          <TaskFiltersBar projectId={project.id} filters={filters} onChange={setFilters} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && <ProjectOverviewTab project={project} />}
        {activeTab === 'wbs' && <WbsTab project={project} filters={filters} />}
        {activeTab === 'kanban' && <KanbanTab project={project} filters={filters} />}
        {activeTab === 'gantt' && <GanttTab project={project} filters={filters} />}
        {activeTab === 'table' && <TableTab project={project} filters={filters} />}
        {activeTab === 'settings' && <ProjectSettingsTab project={project} />}
      </div>

      {taskId && <TaskDetailModal project={project} taskId={taskId} />}
    </div>
  );
}
