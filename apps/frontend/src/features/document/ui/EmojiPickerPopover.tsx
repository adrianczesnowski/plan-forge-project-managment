import { Suspense, lazy, type RefObject } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Popover } from '@/shared/ui/popover';

// Lazy-loaded: the emoji dataset is large, so it only loads when first opened.
const EmojiPicker = lazy(() => import('emoji-picker-react'));

interface EmojiPickerPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  onSelect: (emoji: string) => void;
  /** When set, shows a "remove icon" action. */
  onRemove?: () => void;
}

/** Notion-style emoji picker for a document/folder icon. */
export function EmojiPickerPopover({
  open,
  onClose,
  anchorRef,
  onSelect,
  onRemove,
}: EmojiPickerPopoverProps) {
  const { t } = useTranslation('docs');

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      placement="bottom-start"
      className="w-auto overflow-hidden p-0"
    >
      <Suspense
        fallback={
          <div className="flex h-[360px] w-[320px] items-center justify-center text-[13px] text-faint">
            …
          </div>
        }
      >
        <EmojiPicker
          width={320}
          height={360}
          lazyLoadEmojis
          previewConfig={{ showPreview: false }}
          onEmojiClick={(data) => {
            onSelect(data.emoji);
            onClose();
          }}
        />
      </Suspense>
      {onRemove && (
        <button
          type="button"
          onClick={() => {
            onRemove();
            onClose();
          }}
          className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t('icon.remove')}
        </button>
      )}
    </Popover>
  );
}
