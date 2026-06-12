import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProjectWithRole, TaskTreeNode } from '@planforge/shared';
import { useProjectTasks } from '@/entities/task/hooks/use-tasks';
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from '@/features/task/hooks/use-task-mutations';
import { useMoveTask } from '@/features/task/hooks/use-move-task';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';
import { WbsTable } from './WbsTable';
import { WbsQuickAdd } from './WbsQuickAdd';

interface SubtaskTarget {
  parentId: string;
  parentTitle: string;
}

export function WbsTab({ project }: { project: ProjectWithRole }) {
  const { t } = useTranslation('tasks');
  const navigate = useNavigate();
  const { data: tasks, isPending } = useProjectTasks(project.id);
  const createTask = useCreateTask(project.id);
  const updateTask = useUpdateTask(project.id);
  const deleteTask = useDeleteTask(project.id);
  const moveTask = useMoveTask(project.id);

  const [subtaskTarget, setSubtaskTarget] = useState<SubtaskTarget | null>(null);
  const canEdit = project.myRole !== 'VIEWER';

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
      <div className="flex-1 overflow-y-auto">
        {tasks && tasks.length > 0 ? (
          <WbsTable
            tasks={tasks}
            canEdit={canEdit}
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
          <div className="m-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
            <ListTodo className="h-8 w-8 text-faint" />
            <p className="text-sm font-medium text-muted-foreground">{t('empty')}</p>
            <p className="text-[13px] text-faint">{t('emptyHint')}</p>
          </div>
        )}
      </div>

      {canEdit && (
        <WbsQuickAdd
          parentTitle={subtaskTarget?.parentTitle}
          onSubmit={handleAdd}
          onCancel={subtaskTarget ? () => setSubtaskTarget(null) : undefined}
          isPending={createTask.isPending}
        />
      )}
    </div>
  );
}
