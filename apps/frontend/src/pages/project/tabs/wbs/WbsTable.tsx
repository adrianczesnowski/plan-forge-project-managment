import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
import { differenceInCalendarDays, format } from 'date-fns';
import type { TaskPriority, TaskStatus, TaskTreeNode } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import { flattenTree } from '@/entities/task/lib/flatten-tree';
import { TaskStatusSelect } from '@/features/task/ui/TaskStatusSelect';
import { TaskPrioritySelect } from '@/features/task/ui/TaskPrioritySelect';
import {
  collectDescendantIds,
  getDropProjection,
  type DropProjection,
  type FlatTask,
} from '@/features/task/lib/wbs-dnd';
import { WbsSortableRow } from './WbsSortableRow';
import { WbsMoveMenu } from './WbsMoveMenu';

/** Must match the per-level padding used in the title cell. */
const INDENT_WIDTH = 20;

/** Drag state shared with column cells through the table's meta. */
interface WbsTableMeta {
  activeId: string | null;
  projectedDepth: number | null;
}

export interface WbsTableCallbacks {
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onAddSubtask: (task: TaskTreeNode) => void;
  onDelete: (taskId: string) => void;
  onOpenTask: (taskId: string) => void;
  onMove: (taskId: string, parentId: string | null, index: number) => void;
}

interface WbsTableProps extends WbsTableCallbacks {
  tasks: TaskTreeNode[];
  canEdit: boolean;
  /** Row drag & drop — disabled while filters hide part of the tree. */
  dndEnabled?: boolean;
}

function ResourceCell({ task }: { task: TaskTreeNode }) {
  if (!task.assignee) return <span className="text-faint">—</span>;
  return (
    <span className="inline-block rounded-full bg-[#f0f0f5] px-2 py-0.5 text-[11.5px] font-medium text-foreground">
      {task.assignee.firstName} {task.assignee.lastName.charAt(0)}.
    </span>
  );
}

function ProgressCell({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-[5px] w-[52px] overflow-hidden rounded-[3px] bg-border-light">
        <div className="h-full rounded-[3px] bg-accent-blue" style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-[12px] font-medium text-muted-foreground">{value}%</span>
    </div>
  );
}

export function WbsTable({
  tasks,
  canEdit,
  dndEnabled = true,
  onStatusChange,
  onPriorityChange,
  onAddSubtask,
  onDelete,
  onOpenTask,
  onMove,
}: WbsTableProps) {
  const { t } = useTranslation('tasks');
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [projection, setProjection] = useState<DropProjection | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Stable per-task display number (DFS order), independent of expand state.
  const idMap = useMemo(() => {
    const map = new Map<string, number>();
    flattenTree(tasks).forEach((node, i) => map.set(node.id, i + 1));
    return map;
  }, [tasks]);

  const columns = useMemo<ColumnDef<TaskTreeNode>[]>(
    () => [
      {
        id: 'id',
        header: t('columns.id'),
        size: 42,
        cell: ({ row }) => (
          <span className="block text-center text-[12px] text-faint">{idMap.get(row.original.id)}</span>
        ),
      },
      {
        id: 'wbs',
        header: t('columns.wbs'),
        size: 56,
        cell: ({ row }) => (
          <span className="block text-center font-mono text-[12px] font-medium text-muted-foreground">
            {row.original.wbsNumber}
          </span>
        ),
      },
      {
        id: 'title',
        header: t('columns.title'),
        size: 360,
        cell: ({ row, table }) => {
          // While dragging, the active row previews its projected nesting level.
          const meta = table.options.meta as WbsTableMeta | undefined;
          const depth =
            meta?.activeId === row.original.id && meta.projectedDepth !== null
              ? meta.projectedDepth
              : row.depth;
          const isPhase = row.original.children.length > 0;
          return (
            <div className="flex items-center gap-1" style={{ paddingLeft: depth * INDENT_WIDTH }}>
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
              {isPhase && (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                  style={{ background: 'var(--color-accent-purple)' }}
                />
              )}
              <button
                type="button"
                onClick={() => onOpenTask(row.original.id)}
                className={cn(
                  'truncate text-left text-[13px] hover:text-primary hover:underline',
                  isPhase ? 'font-bold' : 'font-normal',
                  row.original.status === 'CANCELLED' && 'text-faint line-through',
                )}
              >
                {row.original.title}
              </button>
            </div>
          );
        },
      },
      {
        id: 'duration',
        header: t('columns.duration'),
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
        id: 'finishDate',
        header: t('columns.finish'),
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
        // TODO: predecessors require a project-wide dependency fetch (not in the task tree yet).
        id: 'predecessors',
        header: t('columns.predecessors'),
        size: 90,
        cell: () => <span className="block text-center text-faint">—</span>,
      },
      {
        id: 'resource',
        header: t('columns.resource'),
        size: 100,
        cell: ({ row }) => <ResourceCell task={row.original} />,
      },
      {
        id: 'milestone',
        header: () => <Gem className="mx-auto h-3.5 w-3.5" />,
        size: 40,
        cell: ({ row }) =>
          row.original.isMilestone ? (
            <Gem className="mx-auto h-3.5 w-3.5 text-accent-purple" />
          ) : null,
      },
      {
        id: 'priority',
        header: t('columns.priority'),
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
        size: 120,
        cell: ({ row }) => (
          <TaskStatusSelect
            value={row.original.status}
            disabled={!canEdit}
            onChange={(status) => onStatusChange(row.original.id, status)}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 70,
        cell: ({ row }) =>
          canEdit && (
            <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                title={t('actions.addSubtask')}
                onClick={() => onAddSubtask(row.original)}
                className="flex h-6 w-6 items-center justify-center rounded text-faint hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <WbsMoveMenu tasks={tasks} taskId={row.original.id} onMove={onMove} />
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
    [t, idMap, canEdit, tasks, onStatusChange, onPriorityChange, onAddSubtask, onDelete, onOpenTask, onMove],
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: { expanded },
    meta: {
      activeId,
      projectedDepth: projection?.depth ?? null,
    } satisfies WbsTableMeta,
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const rows = table.getRowModel().rows;
  // Render-ordered flat view of the visible rows — the input for drop projection.
  const flatItems = useMemo<FlatTask[]>(
    () => rows.map((row) => ({ id: row.original.id, parentId: row.original.parentId, depth: row.depth })),
    [rows],
  );

  // The dragged subtree is hidden for the duration of the drag, so the drop
  // target can never be one of the dragged task's own descendants.
  const hiddenIds = useMemo(
    () => (activeId ? collectDescendantIds(flatItems, activeId) : new Set<string>()),
    [flatItems, activeId],
  );
  const visibleRows = activeId ? rows.filter((row) => !hiddenIds.has(row.original.id)) : rows;

  const resetDragState = () => {
    setActiveId(null);
    setProjection(null);
  };

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id));

  const handleDragMove = ({ active, over, delta }: DragMoveEvent) => {
    if (!over) {
      setProjection(null);
      return;
    }
    setProjection(
      getDropProjection(flatItems, String(active.id), String(over.id), delta.x, INDENT_WIDTH),
    );
  };

  const handleDragEnd = ({ active, over, delta }: DragEndEvent) => {
    resetDragState();
    if (!over) return;
    // Dropped in place without horizontal movement → no structural change intended.
    if (active.id === over.id && Math.abs(delta.x) < INDENT_WIDTH) return;
    const drop = getDropProjection(
      flatItems,
      String(active.id),
      String(over.id),
      delta.x,
      INDENT_WIDTH,
    );
    if (!drop) return;
    onMove(String(active.id), drop.parentId, drop.index);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={resetDragState}
    >
      <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-[10px] border border-border text-[13px]">
        <thead>
          <tr>
            <th className="sticky top-0 z-[2] w-7 border-b-2 border-border bg-muted" />
            {table.getFlatHeaders().map((header) => (
              <th
                key={header.id}
                style={{ width: header.getSize() }}
                className="sticky top-0 z-[2] whitespace-nowrap border-b-2 border-border bg-muted px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-[0.04em] text-faint"
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SortableContext
            items={visibleRows.map((row) => row.original.id)}
            strategy={verticalListSortingStrategy}
          >
            {visibleRows.map((row) => (
              <WbsSortableRow
                key={row.id}
                row={row}
                canEdit={canEdit && dndEnabled}
                isPhase={row.original.children.length > 0}
                isDropParent={activeId !== null && projection?.parentId === row.original.id}
              />
            ))}
          </SortableContext>
        </tbody>
      </table>
    </DndContext>
  );
}
