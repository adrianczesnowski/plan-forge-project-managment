import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, IndentDecrease, IndentIncrease, Move } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TaskTreeNode } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import { useClickOutside } from '@/shared/hooks/use-click-outside';
import {
  getStructureMoves,
  type MoveTarget,
  type StructureMoves,
} from '@/features/task/lib/structure-moves';

interface WbsMoveMenuProps {
  tasks: TaskTreeNode[];
  taskId: string;
  onMove: (taskId: string, parentId: string | null, index: number) => void;
}

const ACTIONS: Array<{ key: keyof StructureMoves; icon: typeof Move }> = [
  { key: 'indent', icon: IndentIncrease },
  { key: 'outdent', icon: IndentDecrease },
  { key: 'moveUp', icon: ArrowUp },
  { key: 'moveDown', icon: ArrowDown },
];

/** Popover with structural moves — keyboard-free alternative to drag & drop. */
export function WbsMoveMenu({ tasks, taskId, onMove }: WbsMoveMenuProps) {
  const { t } = useTranslation('tasks');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false));

  // Computed lazily — the tree changes after every move.
  const moves = open ? getStructureMoves(tasks, taskId) : null;

  const run = (target: MoveTarget) => {
    onMove(taskId, target.parentId, target.order);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title={t('moveMenu.title')}
        onClick={() => setOpen((o) => !o)}
        className="flex h-6 w-6 items-center justify-center rounded text-faint hover:bg-muted hover:text-foreground"
      >
        <Move className="h-3.5 w-3.5" />
      </button>

      {open && moves && (
        <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl border border-border bg-white p-1 shadow-lg">
          {ACTIONS.map(({ key, icon: Icon }) => {
            const target = moves[key];
            return (
              <button
                key={key}
                type="button"
                disabled={!target}
                onClick={() => target && run(target)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors',
                  target ? 'hover:bg-muted/60' : 'cursor-not-allowed text-faint',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {t(`moveMenu.${key}`)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
