import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProjectWithRole } from '@planforge/shared';
import { useProjectTasks } from '@/entities/task/hooks/use-tasks';
import { flattenTree } from '@/entities/task/lib/flatten-tree';
import { useUpdateTask } from '@/features/task/hooks/use-task-mutations';
import { hasActiveFilters, matchesFilters, type TaskFilters } from '@/features/task/model/task-filters';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';
import { TaskTable } from './TaskTable';

interface TableTabProps {
  project: ProjectWithRole;
  filters: TaskFilters;
}

/** Flat, sortable table view of every task with inline editing. */
export function TableTab({ project, filters }: TableTabProps) {
  const { t } = useTranslation('tasks');
  const navigate = useNavigate();
  const { data: tree, isPending } = useProjectTasks(project.id);
  const updateTask = useUpdateTask(project.id);
  const canEdit = project.myRole !== 'VIEWER';

  // The table is a flat view — the WBS hierarchy is collapsed away here.
  const rows = useMemo(
    () => (tree ? flattenTree(tree) : []).filter((task) => matchesFilters(task, filters)),
    [tree, filters],
  );

  if (isPending) return <FullPageSpinner />;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto px-6 py-4">
        {rows.length > 0 ? (
          <TaskTable
            tasks={rows}
            canEdit={canEdit}
            onStatusChange={(taskId, status) => updateTask.mutate({ taskId, input: { status } })}
            onPriorityChange={(taskId, priority) =>
              updateTask.mutate({ taskId, input: { priority } })
            }
            onTitleChange={(taskId, title) => updateTask.mutate({ taskId, input: { title } })}
            onOpenTask={(taskId) => navigate(`/projects/${project.id}/tasks/${taskId}`)}
          />
        ) : (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
            <Table2 className="h-8 w-8 text-faint" />
            <p className="text-sm font-medium text-muted-foreground">
              {hasActiveFilters(filters) ? t('filters.noResults') : t('empty')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
