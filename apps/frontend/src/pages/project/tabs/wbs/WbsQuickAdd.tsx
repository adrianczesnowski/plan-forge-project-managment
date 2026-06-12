import { useState } from 'react';
import { CornerDownLeft, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WbsQuickAddProps {
  /** When adding a subtask, the parent task's title is shown as context. */
  parentTitle?: string;
  onSubmit: (title: string) => void;
  onCancel?: () => void;
  isPending: boolean;
}

/** Single-input quick add: type a title, press Enter. */
export function WbsQuickAdd({ parentTitle, onSubmit, onCancel, isPending }: WbsQuickAddProps) {
  const { t } = useTranslation('tasks');
  const [title, setTitle] = useState('');

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed || isPending) return;
    onSubmit(trimmed);
    setTitle('');
  };

  return (
    <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-3 py-2">
      <Plus className="h-4 w-4 shrink-0 text-faint" />
      {parentTitle && (
        <span className="max-w-40 shrink-0 truncate rounded bg-primary/10 px-1.5 py-0.5 text-[11.5px] font-medium text-primary">
          {parentTitle}
        </span>
      )}
      <input
        autoFocus={Boolean(parentTitle)}
        value={title}
        disabled={isPending}
        placeholder={parentTitle ? t('quickAdd.subtaskPlaceholder') : t('quickAdd.placeholder')}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onCancel?.();
        }}
        className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
      />
      {title.trim() && (
        <button type="button" onClick={submit} className="flex items-center gap-1 text-[11.5px] text-faint">
          <CornerDownLeft className="h-3.5 w-3.5" />
        </button>
      )}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="flex h-6 w-6 items-center justify-center rounded text-faint hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
