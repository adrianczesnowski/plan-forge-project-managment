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
import { differenceInCalendarDays, format } from 'date-fns';
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

function ResourceCell({ task }: { task: TaskTreeNode }) {
  if (!task.assignee) return <span className="text-faint">—</span>;
  return (
    <span className="inline-block rounded-full bg-[#f0f0f5] px-2 py-0.5 text-[11.5px] font-medium text-foreground">
      {task.assignee.firstName} {task.assignee.lastName.charAt(0)}.
    </span>
  );
}

function DateCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-faint">—</span>;
  return (
    <span className="text-[12.5px] text-muted-foreground">{format(new Date(value), 'd MMM yyyy')}</span>
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

  // Stable per-task display number, matching the WBS view's ID column.
  const idMap = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((task, i) => map.set(task.id, i + 1));
    return map;
  }, [tasks]);

  const columns = useMemo<ColumnDef<TaskTreeNode>[]>(
    () => [
      {
        id: 'id',
        header: t('columns.id'),
        accessorFn: (task) => idMap.get(task.id) ?? 0,
        size: 42,
        cell: ({ row }) => (
          <span className="block text-center text-[12px] text-faint">{idMap.get(row.original.id)}</span>
        ),
      },
      {
        id: 'wbs',
        header: t('columns.wbs'),
        accessorFn: (task) => task.wbsNumber,
        size: 56,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => onOpenTask(row.original.id)}
            className="block w-full text-center font-mono text-[12px] font-medium text-muted-foreground hover:text-primary hover:underline"
          >
            {row.original.wbsNumber}
          </button>
        ),
      },
      {
        id: 'title',
        header: t('columns.title'),
        accessorFn: (task) => task.title,
        size: 360,
        cell: ({ row }) => (
          <TitleCell
            task={row.original}
            canEdit={canEdit}
            onCommit={(title) => onTitleChange(row.original.id, title)}
          />
        ),
      },
      {
        id: 'duration',
        header: t('columns.duration'),
        accessorFn: (task) =>
          task.startDate && task.endDate
            ? differenceInCalendarDays(new Date(task.endDate), new Date(task.startDate)) + 1
            : 0,
        size: 80,
        cell: ({ row }) => {
          const { startDate, endDate } = row.original;
          if (!startDate || !endDate) return <span className="text-faint">—</span>;
          const days = differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1;
          return <span className="text-[12.5px] text-muted-foreground">{t('modal.meta.days', { count: days })}</span>;
        },
      },
      {
        id: 'startDate',
        header: t('columns.start'),
        accessorFn: (task) => task.startDate ?? '',
        size: 110,
        cell: ({ row }) => <DateCell value={row.original.startDate} />,
      },
      {
        id: 'finishDate',
        header: t('columns.finish'),
        accessorFn: (task) => task.endDate ?? '',
        size: 110,
        cell: ({ row }) => <DateCell value={row.original.endDate} />,
      },
      {
        id: 'progress',
        header: t('columns.progress'),
        accessorFn: (task) => task.progress,
        size: 120,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-[5px] w-[52px] overflow-hidden rounded-[3px] bg-border-light">
              <div className="h-full rounded-[3px] bg-accent-blue" style={{ width: `${row.original.progress}%` }} />
            </div>
            <span className="w-8 text-[12px] font-medium text-muted-foreground">{row.original.progress}%</span>
          </div>
        ),
      },
      {
        id: 'resource',
        header: t('columns.resource'),
        accessorFn: (task) =>
          task.assignee ? `${task.assignee.lastName} ${task.assignee.firstName}` : '',
        size: 100,
        cell: ({ row }) => <ResourceCell task={row.original} />,
      },
      {
        id: 'milestone',
        header: () => <Gem className="mx-auto h-3.5 w-3.5" />,
        accessorFn: (task) => (task.isMilestone ? 1 : 0),
        size: 40,
        cell: ({ row }) =>
          row.original.isMilestone ? <Gem className="mx-auto h-3.5 w-3.5 text-accent-purple" /> : null,
      },
      {
        id: 'priority',
        header: t('columns.priority'),
        accessorFn: (task) => PRIORITY_ORDER[task.priority],
        size: 90,
        cell: ({ row }) => (
          <TaskPrioritySelect
            value={row.original.priority}
            disabled={!canEdit}
            onChange={(priority) => onPriorityChange(row.original.id, priority)}
          />
        ),
      },
      {
        id: 'status',
        header: t('columns.status'),
        accessorFn: (task) => STATUS_ORDER[task.status],
        size: 120,
        cell: ({ row }) => (
          <TaskStatusSelect
            value={row.original.status}
            disabled={!canEdit}
            onChange={(status) => onStatusChange(row.original.id, status)}
          />
        ),
      },
    ],
    [t, idMap, canEdit, onStatusChange, onPriorityChange, onTitleChange, onOpenTask],
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
    <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-[10px] border border-border text-[13px]">
      <thead>
        <tr>
          {table.getFlatHeaders().map((header) => {
            const sorted = header.column.getIsSorted();
            return (
              <th
                key={header.id}
                style={{ width: header.getSize() }}
                className="sticky top-0 z-[2] whitespace-nowrap border-b-2 border-border bg-muted px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-[0.04em] text-faint"
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
          <tr key={row.id} className="transition-colors hover:bg-muted/40 [&>td]:border-b [&>td]:border-border-light">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="whitespace-nowrap px-3 py-2 align-middle text-muted-foreground">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
