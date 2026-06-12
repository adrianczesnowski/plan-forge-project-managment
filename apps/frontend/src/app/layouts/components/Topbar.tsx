import { Bell, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Topbar() {
  const { t } = useTranslation('common');

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white px-4">
      <div className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-[10px] border border-border px-3 transition-colors focus-within:border-primary">
        <Search className="h-4 w-4 shrink-0 text-faint" />
        <input
          type="text"
          placeholder={t('topbar.searchPlaceholder')}
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
        />
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10.5px] text-faint">
          ⌘K
        </kbd>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
      >
        <Bell className="h-[15px] w-[15px]" />
      </button>
    </header>
  );
}
