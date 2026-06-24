import { type RefObject } from 'react';
import { FilePlus2, Pencil, Share2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Popover } from '@/shared/ui/popover';
import { cn } from '@/shared/lib/utils';

interface DocRowMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  /** Sharing, nesting & delete are owner-only; the items are hidden when false. */
  canManage: boolean;
  /** Rename is allowed for editors (owner or EDIT grant). */
  canEdit: boolean;
  onShare: () => void;
  onRename: () => void;
  onCreateInside: () => void;
  onDelete: () => void;
}

/** The per-row "⋯" context menu: share, rename, create inside, delete. */
export function DocRowMenu({
  open,
  onClose,
  anchorRef,
  canManage,
  canEdit,
  onShare,
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
      {canManage && (
        <button type="button" className={item} onClick={run(onShare)}>
          <Share2 className="h-4 w-4 text-muted-foreground" />
          {t('menu.share')}
        </button>
      )}
      {canEdit && (
        <button type="button" className={item} onClick={run(onRename)}>
          <Pencil className="h-4 w-4 text-muted-foreground" />
          {t('menu.rename')}
        </button>
      )}
      {canManage && (
        <button type="button" className={item} onClick={run(onCreateInside)}>
          <FilePlus2 className="h-4 w-4 text-muted-foreground" />
          {t('menu.createInside')}
        </button>
      )}
      {canManage && (
        <>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            className={cn(item, 'text-destructive hover:bg-destructive/10')}
            onClick={run(onDelete)}
          >
            <Trash2 className="h-4 w-4" />
            {t('menu.delete')}
          </button>
        </>
      )}
    </Popover>
  );
}
