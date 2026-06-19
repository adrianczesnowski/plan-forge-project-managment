import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NotificationBell } from './NotificationBell';
import { CommandPalette } from '@/features/search/ui/CommandPalette';

export function Topbar() {
  const { t } = useTranslation('common');
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl+K opens the command palette anywhere in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white px-4">
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-[10px] border border-border px-3 text-left transition-colors hover:border-primary/50"
      >
        <Search className="h-4 w-4 shrink-0 text-faint" />
        <span className="w-full truncate text-[13px] text-faint">{t('topbar.searchPlaceholder')}</span>
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10.5px] text-faint">
          ⌘K
        </kbd>
      </button>

      <div className="flex-1" />

      <NotificationBell />

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
