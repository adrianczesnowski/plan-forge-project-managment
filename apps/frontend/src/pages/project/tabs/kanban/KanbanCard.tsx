import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, Flag, Gem } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { TaskTreeNode } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-accent-blue',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-accent-orange',
  URGENT: 'text-destructive',
};

interface KanbanCardProps {
  task: TaskTreeNode;
  canEdit: boolean;
  onOpen: (taskId: string) => void;
  /** Render-only mode for the DragOverlay (no dnd wiring). */
  overlay?: boolean;
}

export function KanbanCard({ task, canEdit, onOpen, overlay = false }: KanbanCardProps) {
  const { t } = useTranslation('tasks');
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !canEdit || overlay,
  });

  const priorityColor = PRIORITY_COLORS[task.priority];

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      style={overlay ? undefined : { transform: CSS.Translate.toString(transform) }}
      onClick={() => !isDragging && onOpen(task.id)}
      className={cn(
        'flex cursor-pointer flex-col gap-2 rounded-xl border border-border bg-white p-3 shadow-sm transition-shadow hover:shadow-md',
        isDragging && 'opacity-30',
        overlay && 'rotate-2 shadow-xl',
      )}
    >
      <div className="flex items-start gap-1.5">
        {task.isMilestone && <Gem className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-purple" />}
        <span className="text-[13px] font-medium leading-snug">{task.title}</span>
      </div>

      <div className="flex items-center gap-3 text-[11.5px] text-faint">
        <span className="font-mono">{task.wbsNumber}</span>
        {priorityColor && (
          <span className={cn('flex items-center gap-1', priorityColor)} title={t(`priority.${task.priority}`)}>
            <Flag className="h-3 w-3" />
            {t(`priority.${task.priority}`)}
          </span>
        )}
        {task.endDate && (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {format(new Date(task.endDate), 'd MMM')}
          </span>
        )}
        {task.assignee && (
          <span
            title={`${task.assignee.firstName} ${task.assignee.lastName}`}
            className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white"
          >
            {task.assignee.firstName.charAt(0)}
            {task.assignee.lastName.charAt(0)}
          </span>
        )}
      </div>
    </div>
  );
}
