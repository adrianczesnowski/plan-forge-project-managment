import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronsUpDown, ChevronUp, Gem } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { TaskPriority, TaskStatus, type TaskTreeNode } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import { TaskStatusSelect } from '@/features/task/ui/TaskStatusSelect';
import { TaskPrioritySelect } from '@/features/task/ui/TaskPrioritySelect';

/** Enum sort order so status/priority columns sort by workflow, not alphabet. */
const STATUS_ORDER: Record<TaskStatus, number> = {
  [TaskStatus.TODO]: 0,
  [TaskStatus.IN_PROGRESS]: 1,
  [TaskStatus.IN_REVIEW]: 2,
  [TaskStatus.DONE]: 3,
  [TaskStatus.CANCELLED]: 4,
};
const PRIORITY_ORDER: Record<TaskPriority, number> = {
  [TaskPriority.NONE]: 0,
  [TaskPriority.LOW]: 1,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.HIGH]: 3,
  [TaskPriority.URGENT]: 4,
};

export interface TaskTableCallbacks {
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onOpenTask: (taskId: string) => void;
}

interface TaskTableProps extends TaskTableCallbacks {
  tasks: TaskTreeNode[];
  canEdit: boolean;
}

/** Inline-editable title cell — click to edit, Enter/blur commits, Esc cancels. */
function TitleCell({
  task,
  canEdit,
  onCommit,
}: {
  task: TaskTreeNode;
  canEdit: boolean;
  onCommit: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(task.title);

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5">
        {task.isMilestone && <Gem className="h-3.5 w-3.5 shrink-0 text-accent-purple" />}
        <button
          type="button"
          onClick={() => canEdit && setEditing(true)}
          className={cn(
            'truncate text-left text-[13px]',
            canEdit ? 'hover:text-primary' : 'cursor-default',
            task.status === 'CANCELLED' && 'text-faint line-through',
          )}
        >
          {task.title}
        </button>
      </div>
    );
  }

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== task.title) onCommit(trimmed);
    else setValue(task.title);
    setEditing(false);
  };

  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') {
          setValue(task.title);
          setEditing(false);
        }
      }}
      className="w-full rounded border border-primary bg-card px-1.5 py-0.5 text-[13px] outline-none"
    />
  );
}

function AssigneeCell({ task }: { task: TaskTreeNode }) {
  if (!task.assignee) return <span className="text-faint">—</span>;
  const initials =
    `${task.assignee.firstName.charAt(0)}${task.assignee.lastName.charAt(0)}`.toUpperCase();
  return (
    <span
      title={`${task.assignee.firstName} ${task.assignee.lastName}`}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
    >
      {initials}
    </span>
  );
}

export function TaskTable({
  tasks,
  canEdit,
  onStatusChange,
  onPriorityChange,
  onTitleChange,
  onOpenTask,
}: TaskTableProps) {
  const { t } = useTranslation('tasks');
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<TaskTreeNode>[]>(
    () => [
      {
        id: 'wbs',
        header: t('columns.wbs'),
        accessorFn: (task) => task.wbsNumber,
        size: 80,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => onOpenTask(row.original.id)}
            className="font-mono text-[11.5px] text-faint hover:text-primary hover:underline"
          >
            {row.original.wbsNumber}
          </button>
        ),
      },
      {
        id: 'title',
        header: t('columns.title'),
        accessorFn: (task) => task.title,
        size: 420,
        cell: ({ row }) => (
          <TitleCell
            task={row.original}
            canEdit={canEdit}
            onCommit={(title) => onTitleChange(row.original.id, title)}
          />
        ),
      },
      {
        id: 'status',
        header: t('columns.status'),
        accessorFn: (task) => STATUS_ORDER[task.status],
        size: 130,
        cell: ({ row }) => (
          <TaskStatusSelect
            value={row.original.status}
            disabled={!canEdit}
            onChange={(status) => onStatusChange(row.original.id, status)}
          />
        ),
      },
      {
        id: 'priority',
        header: t('columns.priority'),
        accessorFn: (task) => PRIORITY_ORDER[task.priority],
        size: 110,
        cell: ({ row }) => (
          <TaskPrioritySelect
            value={row.original.priority}
            disabled={!canEdit}
            onChange={(priority) => onPriorityChange(row.original.id, priority)}
          />
        ),
      },
      {
        id: 'assignee',
        header: t('columns.assignee'),
        accessorFn: (task) =>
          task.assignee ? `${task.assignee.lastName} ${task.assignee.firstName}` : '',
        size: 90,
        cell: ({ row }) => <AssigneeCell task={row.original} />,
      },
      {
        id: 'startDate',
        header: t('columns.startDate'),
        accessorFn: (task) => task.startDate ?? '',
        size: 110,
        cell: ({ row }) =>
          row.original.startDate ? (
            <span className="text-[12.5px] text-muted-foreground">
              {format(new Date(row.original.startDate), 'd MMM yyyy')}
            </span>
          ) : (
            <span className="text-faint">—</span>
          ),
      },
      {
        id: 'dueDate',
        header: t('columns.dueDate'),
        accessorFn: (task) => task.endDate ?? '',
        size: 110,
        cell: ({ row }) =>
          row.original.endDate ? (
            <span className="text-[12.5px] text-muted-foreground">
              {format(new Date(row.original.endDate), 'd MMM yyyy')}
            </span>
          ) : (
            <span className="text-faint">—</span>
          ),
      },
      {
        id: 'progress',
        header: t('columns.progress'),
        accessorFn: (task) => task.progress,
        size: 130,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-border-light">
              <div
                className="h-full rounded-full bg-accent-green"
                style={{ width: `${row.original.progress}%` }}
              />
            </div>
            <span className="w-8 text-right text-[11.5px] text-muted-foreground">
              {row.original.progress}%
            </span>
          </div>
        ),
      },
    ],
    [t, canEdit, onStatusChange, onPriorityChange, onTitleChange, onOpenTask],
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border">
          {table.getFlatHeaders().map((header) => {
            const sorted = header.column.getIsSorted();
            return (
              <th
                key={header.id}
                style={{ width: header.getSize() }}
                className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-faint"
              >
                <button
                  type="button"
                  onClick={header.column.getToggleSortingHandler()}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {sorted === 'asc' ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : sorted === 'desc' ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronsUpDown className="h-3 w-3 opacity-40" />
                  )}
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="border-b border-border-light hover:bg-muted/40">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-3 py-1.5">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
