import { useDroppable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import type { TaskStatus, TaskTreeNode } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import { KanbanCard } from './KanbanCard';

const COLUMN_ACCENTS: Record<string, string> = {
  TODO: 'bg-faint',
  IN_PROGRESS: 'bg-accent-blue',
  IN_REVIEW: 'bg-accent-orange',
  DONE: 'bg-accent-green',
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: TaskTreeNode[];
  canEdit: boolean;
  onOpen: (taskId: string) => void;
}

export function KanbanColumn({ status, tasks, canEdit, onOpen }: KanbanColumnProps) {
  const { t } = useTranslation('tasks');
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/40">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={cn('h-2 w-2 rounded-full', COLUMN_ACCENTS[status])} />
        <span className="text-[12.5px] font-semibold">{t(`status.${status}`)}</span>
        <span className="rounded-full bg-border-light px-1.5 text-[11px] font-semibold text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-24 flex-1 flex-col gap-2 rounded-b-xl p-2 pt-0 transition-colors',
          isOver && 'bg-primary/5 ring-2 ring-inset ring-primary/20',
        )}
      >
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} canEdit={canEdit} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
