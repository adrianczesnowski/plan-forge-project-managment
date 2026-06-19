import { type RefObject } from 'react';
import { FilePlus2, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocumentNodeType } from '@planforge/shared';
import { Popover } from '@/shared/ui/popover';
import { cn } from '@/shared/lib/utils';

interface DocRowMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  nodeType: DocumentNodeType;
  onRename: () => void;
  onCreateInside: () => void;
  onDelete: () => void;
}

/** The per-row "⋯" context menu: rename, create inside, delete. */
export function DocRowMenu({
  open,
  onClose,
  anchorRef,
  nodeType,
  onRename,
  onCreateInside,
  onDelete,
}: DocRowMenuProps) {
  const { t } = useTranslation('docs');

  const item =
    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-foreground transition-colors hover:bg-muted';

  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      placement="bottom-end"
      className="w-[180px]"
    >
      <button type="button" className={item} onClick={run(onRename)}>
        <Pencil className="h-4 w-4 text-muted-foreground" />
        {t('menu.rename')}
      </button>
      <button type="button" className={item} onClick={run(onCreateInside)}>
        <FilePlus2 className="h-4 w-4 text-muted-foreground" />
        {nodeType === 'FOLDER' ? t('menu.createInside') : t('menu.createInside')}
      </button>
      <div className="my-1 h-px bg-border" />
      <button
        type="button"
        className={cn(item, 'text-destructive hover:bg-destructive/10')}
        onClick={run(onDelete)}
      >
        <Trash2 className="h-4 w-4" />
        {t('menu.delete')}
      </button>
    </Popover>
  );
}
