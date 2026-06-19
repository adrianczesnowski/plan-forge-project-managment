import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, Gem } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { TaskTreeNode } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';

/** Priority pill tints — consistent with the WBS / Table / modal badges. */
const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'bg-accent-green/10 text-accent-green',
  MEDIUM: 'bg-accent-orange/10 text-accent-orange',
  HIGH: 'bg-destructive/10 text-destructive',
  URGENT: 'bg-destructive/15 text-destructive',
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

  const priorityBadge = PRIORITY_BADGE[task.priority];

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      style={overlay ? undefined : { transform: CSS.Translate.toString(transform) }}
      onClick={() => !isDragging && onOpen(task.id)}
      className={cn(
        'flex cursor-pointer flex-col gap-2.5 rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
        isDragging && 'opacity-30',
        overlay && 'rotate-2 shadow-xl',
      )}
    >
      <div className="flex items-start gap-1.5">
        {task.isMilestone && <Gem className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-purple" />}
        <span
          className={cn(
            'text-[13px] font-medium leading-snug',
            task.status === 'CANCELLED' && 'text-faint line-through',
          )}
        >
          {task.title}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-faint">
        <span className="font-mono">{task.wbsNumber}</span>
        {priorityBadge && (
          <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-semibold', priorityBadge)}>
            {t(`priority.${task.priority}`)}
          </span>
        )}
        {task.endDate && (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {format(new Date(task.endDate), 'd MMM')}
          </span>
        )}
      </div>

      {(task.progress > 0 || task.assignee) && (
        <div className="flex items-center gap-2">
          {task.progress > 0 && (
            <>
              <div className="h-[5px] flex-1 overflow-hidden rounded-[3px] bg-border-light">
                <div
                  className="h-full rounded-[3px] bg-accent-blue"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span className="text-[11px] text-faint">{task.progress}%</span>
            </>
          )}
          {task.assignee && (
            <span
              className={cn(
                'shrink-0 rounded-full bg-[#f0f0f5] px-2 py-0.5 text-[11px] font-medium text-foreground',
                task.progress > 0 ? 'ml-1' : 'ml-auto',
              )}
            >
              {task.assignee.firstName} {task.assignee.lastName.charAt(0)}.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
