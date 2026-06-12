import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
} from '@tanstack/react-table';
import { ChevronRight, Gem, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { TaskPriority, TaskStatus, TaskTreeNode } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import { TaskStatusSelect } from '@/features/task/ui/TaskStatusSelect';
import { TaskPrioritySelect } from '@/features/task/ui/TaskPrioritySelect';

export interface WbsTableCallbacks {
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onAddSubtask: (task: TaskTreeNode) => void;
  onDelete: (taskId: string) => void;
}

interface WbsTableProps extends WbsTableCallbacks {
  tasks: TaskTreeNode[];
  canEdit: boolean;
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

function ProgressCell({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-border-light">
        <div className="h-full rounded-full bg-accent-green" style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right text-[11.5px] text-muted-foreground">{value}%</span>
    </div>
  );
}

export function WbsTable({
  tasks,
  canEdit,
  onStatusChange,
  onPriorityChange,
  onAddSubtask,
  onDelete,
}: WbsTableProps) {
  const { t } = useTranslation('tasks');
  const [expanded, setExpanded] = useState<ExpandedState>(true);

  const columns = useMemo<ColumnDef<TaskTreeNode>[]>(
    () => [
      {
        id: 'wbs',
        header: t('columns.wbs'),
        size: 70,
        cell: ({ row }) => (
          <span className="font-mono text-[11.5px] text-faint">{row.original.wbsNumber}</span>
        ),
      },
      {
        id: 'title',
        header: t('columns.title'),
        size: 400,
        cell: ({ row }) => (
          <div className="flex items-center gap-1" style={{ paddingLeft: row.depth * 20 }}>
            {row.getCanExpand() ? (
              <button
                type="button"
                onClick={row.getToggleExpandedHandler()}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-faint hover:bg-muted hover:text-foreground"
              >
                <ChevronRight
                  className={cn('h-3.5 w-3.5 transition-transform', row.getIsExpanded() && 'rotate-90')}
                />
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            {row.original.isMilestone && <Gem className="h-3.5 w-3.5 shrink-0 text-accent-purple" />}
            <span
              className={cn(
                'truncate text-[13px]',
                row.original.children.length > 0 && 'font-semibold',
                row.original.status === 'CANCELLED' && 'text-faint line-through',
              )}
            >
              {row.original.title}
            </span>
          </div>
        ),
      },
      {
        id: 'status',
        header: t('columns.status'),
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
        size: 90,
        cell: ({ row }) => <AssigneeCell task={row.original} />,
      },
      {
        id: 'dueDate',
        header: t('columns.dueDate'),
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
        size: 120,
        cell: ({ row }) => <ProgressCell value={row.original.progress} />,
      },
      {
        id: 'actions',
        header: '',
        size: 70,
        cell: ({ row }) =>
          canEdit && (
            <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                title={t('actions.addSubtask')}
                onClick={() => onAddSubtask(row.original)}
                className="flex h-6 w-6 items-center justify-center rounded text-faint hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title={t('actions.delete')}
                onClick={() => onDelete(row.original.id)}
                className="flex h-6 w-6 items-center justify-center rounded text-faint hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ),
      },
    ],
    [t, canEdit, onStatusChange, onPriorityChange, onAddSubtask, onDelete],
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border">
          {table.getFlatHeaders().map((header) => (
            <th
              key={header.id}
              style={{ width: header.getSize() }}
              className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-faint"
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="group border-b border-border-light transition-colors hover:bg-muted/40">
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
