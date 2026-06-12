import { useState } from 'react';
import { Check, ListChecks, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TaskStatus, type TaskTreeNode } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import { useCreateTask, useUpdateTask } from '../../hooks/use-task-mutations';

interface TaskSubtasksProps {
  task: TaskTreeNode;
  projectId: string;
  canEdit: boolean;
}

export function TaskSubtasks({ task, projectId, canEdit }: TaskSubtasksProps) {
  const { t } = useTranslation('tasks');
  const navigate = useNavigate();
  const updateTask = useUpdateTask(projectId);
  const createTask = useCreateTask(projectId);
  const [newTitle, setNewTitle] = useState('');

  const doneCount = task.children.filter((c) => c.status === TaskStatus.DONE).length;

  const toggle = (subtask: TaskTreeNode) =>
    updateTask.mutate({
      taskId: subtask.id,
      input: { status: subtask.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE },
    });

  const addSubtask = () => {
    const title = newTitle.trim();
    if (!title || createTask.isPending) return;
    createTask.mutate(
      { title, parentId: task.id, status: 'TODO', priority: 'NONE', isMilestone: false },
      { onSuccess: () => setNewTitle('') },
    );
  };

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
        <ListChecks className="h-4 w-4" />
        {t('modal.subtasks')}
        {task.children.length > 0 && (
          <span className="text-[12px] font-normal text-faint">
            {doneCount} / {task.children.length}
          </span>
        )}
      </h3>

      <div className="flex flex-col">
        {task.children.map((subtask) => {
          const isDone = subtask.status === TaskStatus.DONE;
          return (
            <div
              key={subtask.id}
              className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40"
            >
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => toggle(subtask)}
                className={cn(
                  'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors',
                  isDone
                    ? 'border-accent-green bg-accent-green text-white'
                    : 'border-border hover:border-accent-green',
                )}
              >
                {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/projects/${projectId}/tasks/${subtask.id}`)}
                className={cn(
                  'flex-1 truncate text-left text-[13px] hover:text-primary',
                  isDone && 'text-faint line-through',
                )}
              >
                {subtask.title}
              </button>
              {subtask.assignee && (
                <span className="shrink-0 text-[11.5px] text-faint">
                  {subtask.assignee.firstName} {subtask.assignee.lastName.charAt(0)}.
                </span>
              )}
            </div>
          );
        })}
      </div>

      {canEdit && (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-dashed border-border px-2 py-1.5">
          <Plus className="h-3.5 w-3.5 shrink-0 text-faint" />
          <input
            value={newTitle}
            disabled={createTask.isPending}
            placeholder={t('modal.addSubtask')}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
          />
        </div>
      )}
    </div>
  );
}
