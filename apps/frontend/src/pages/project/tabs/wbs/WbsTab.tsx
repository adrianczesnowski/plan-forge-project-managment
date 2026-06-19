import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Columns3, Download, ListTodo, ListTree, Plus, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProjectWithRole, TaskTreeNode } from '@planforge/shared';
import { useProjectTasks } from '@/entities/task/hooks/use-tasks';
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from '@/features/task/hooks/use-task-mutations';
import { useMoveTask } from '@/features/task/hooks/use-move-task';
import {
  filterTaskTree,
  hasActiveFilters,
  type TaskFilters,
} from '@/features/task/model/task-filters';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';
import { WbsTable } from './WbsTable';
import { WbsQuickAdd } from './WbsQuickAdd';

interface SubtaskTarget {
  parentId: string;
  parentTitle: string;
}

interface WbsTabProps {
  project: ProjectWithRole;
  filters: TaskFilters;
}

export function WbsTab({ project, filters }: WbsTabProps) {
  const { t } = useTranslation('tasks');
  const navigate = useNavigate();
  const { data: tasks, isPending } = useProjectTasks(project.id);
  const visibleTasks = useMemo(() => filterTaskTree(tasks ?? [], filters), [tasks, filters]);
  const createTask = useCreateTask(project.id);
  const updateTask = useUpdateTask(project.id);
  const deleteTask = useDeleteTask(project.id);
  const moveTask = useMoveTask(project.id);

  const [subtaskTarget, setSubtaskTarget] = useState<SubtaskTarget | null>(null);
  const quickAddRef = useRef<HTMLInputElement>(null);
  const canEdit = project.myRole !== 'VIEWER';

  const focusNewTask = () => {
    setSubtaskTarget(null);
    quickAddRef.current?.focus();
    quickAddRef.current?.scrollIntoView({ block: 'nearest' });
  };

  if (isPending) return <FullPageSpinner />;

  const handleAdd = (title: string) =>
    createTask.mutate(
      { title, parentId: subtaskTarget?.parentId, status: 'TODO', priority: 'NONE', isMilestone: false },
      { onSuccess: () => setSubtaskTarget(null) },
    );

  const handleDelete = (taskId: string) => {
    if (window.confirm(t('actions.deleteConfirm'))) {
      deleteTask.mutate(taskId);
    }
  };

  const handleAddSubtask = (task: TaskTreeNode) =>
    setSubtaskTarget({ parentId: task.id, parentTitle: task.title });

  return (
    <div className="flex h-full flex-col">
      {/* Action bar */}
      <div className="flex flex-shrink-0 items-center gap-2 px-6 py-3">
        {canEdit && (
          <button
            type="button"
            onClick={focusNewTask}
            className="flex items-center gap-1.5 rounded-lg border border-accent-green bg-accent-green px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#16a34a]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            {t('actions.addTask')}
          </button>
        )}
        {/* TODO: wire group-by-phase, column picker and export to real behaviour. */}
        <button type="button" className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t('actions.filter')}
        </button>
        <button type="button" className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted">
          <ListTree className="h-3.5 w-3.5" />
          {t('actions.groupByPhase')}
        </button>
        <button type="button" className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted">
          <Columns3 className="h-3.5 w-3.5" />
          {t('actions.columns')}
        </button>
        <button type="button" className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted">
          <Download className="h-3.5 w-3.5" />
          {t('actions.export')}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-4">
        {visibleTasks.length > 0 ? (
          <WbsTable
            tasks={visibleTasks}
            canEdit={canEdit}
            dndEnabled={!hasActiveFilters(filters)}
            onStatusChange={(taskId, status) => updateTask.mutate({ taskId, input: { status } })}
            onPriorityChange={(taskId, priority) =>
              updateTask.mutate({ taskId, input: { priority } })
            }
            onAddSubtask={handleAddSubtask}
            onDelete={handleDelete}
            onOpenTask={(taskId) => navigate(`/projects/${project.id}/tasks/${taskId}`)}
            onMove={(taskId, parentId, index) =>
              moveTask.mutate({ taskId, input: { parentId, order: index } })
            }
          />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
            <ListTodo className="h-8 w-8 text-faint" />
            <p className="text-sm font-medium text-muted-foreground">
              {hasActiveFilters(filters) ? t('filters.noResults') : t('empty')}
            </p>
            {!hasActiveFilters(filters) && <p className="text-[13px] text-faint">{t('emptyHint')}</p>}
          </div>
        )}
      </div>

      {canEdit && (
        <WbsQuickAdd
          parentTitle={subtaskTarget?.parentTitle}
          inputRef={quickAddRef}
          onSubmit={handleAdd}
          onCancel={subtaskTarget ? () => setSubtaskTarget(null) : undefined}
          isPending={createTask.isPending}
        />
      )}
    </div>
  );
}
