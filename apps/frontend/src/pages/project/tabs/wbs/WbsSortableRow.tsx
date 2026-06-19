import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { flexRender, type Row } from '@tanstack/react-table';
import type { TaskTreeNode } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';

interface WbsSortableRowProps {
  row: Row<TaskTreeNode>;
  canEdit: boolean;
  /** Summary task (has children) — gets the MS-Project phase-row highlight. */
  isPhase?: boolean;
  /** This row would become the dragged task's parent if dropped now. */
  isDropParent?: boolean;
}

/** Table row wired into dnd-kit sortable, with a drag handle in the first cell. */
export function WbsSortableRow({ row, canEdit, isPhase = false, isDropParent = false }: WbsSortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.original.id,
    disabled: !canEdit,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'group transition-colors hover:bg-muted/40 [&>td]:border-b [&>td]:border-border-light',
        isPhase && 'bg-muted/40 [&>td]:font-medium [&>td]:text-foreground',
        isDragging && 'relative z-10 bg-primary/5 opacity-90 shadow-lg ring-1 ring-inset ring-primary/30',
        isDropParent && 'bg-primary/5',
      )}
    >
      <td className="w-7 pl-2">
        {canEdit && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex h-5 w-5 cursor-grab items-center justify-center rounded text-faint opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
      </td>
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="whitespace-nowrap px-3 py-2 align-middle text-muted-foreground">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}
