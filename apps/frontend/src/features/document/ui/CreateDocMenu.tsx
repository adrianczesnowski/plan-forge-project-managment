import { type RefObject } from 'react';
import { FileText, Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocumentNodeType } from '@planforge/shared';
import { Popover } from '@/shared/ui/popover';

interface CreateDocMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  placement?: 'top-stretch' | 'right-start' | 'bottom-start';
  onSelect: (type: DocumentNodeType) => void;
}

/** Confluence-style "Create" menu offering a Document or a Folder. */
export function CreateDocMenu({
  open,
  onClose,
  anchorRef,
  placement = 'top-stretch',
  onSelect,
}: CreateDocMenuProps) {
  const { t } = useTranslation('docs');

  const pick = (type: DocumentNodeType) => {
    onSelect(type);
    onClose();
  };

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      placement={placement}
      className="w-[280px]"
    >
      <button
        type="button"
        onClick={() => pick('DOC')}
        className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left transition-colors hover:bg-muted"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ede9fe] text-accent-purple">
          <FileText className="h-[17px] w-[17px]" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[13px] font-semibold leading-tight text-foreground">
            {t('create.doc')}
          </span>
          <span className="text-[11.5px] leading-snug text-faint">{t('create.docDescription')}</span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => pick('FOLDER')}
        className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left transition-colors hover:bg-muted"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fef3c7] text-accent-orange">
          <Folder className="h-[17px] w-[17px]" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[13px] font-semibold leading-tight text-foreground">
            {t('create.folder')}
          </span>
          <span className="text-[11.5px] leading-snug text-faint">
            {t('create.folderDescription')}
          </span>
        </span>
      </button>
    </Popover>
  );
}
