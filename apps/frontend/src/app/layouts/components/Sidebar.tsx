import { NavLink } from 'react-router-dom';
import { FileText, LayoutGrid, Layers, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { SidebarSpaces } from './SidebarSpaces';
import { SidebarFavorites } from './SidebarFavorites';
import { SidebarUser } from './SidebarUser';

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
    isActive && 'bg-muted font-semibold text-foreground',
  );

export function Sidebar() {
  const { t } = useTranslation('common');

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-[#fafafa]">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-green">
          <Layers className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold">{t('appName')}</span>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        <NavLink to="/" end className={navItemClass}>
          <LayoutGrid className="h-[17px] w-[17px]" />
          {t('nav.dashboard')}
        </NavLink>
        <NavLink to="/docs" className={navItemClass}>
          <FileText className="h-[17px] w-[17px]" />
          {t('nav.docs')}
        </NavLink>
      </nav>

      <div className="flex-1 overflow-y-auto">
        <SidebarFavorites />
        <SidebarSpaces />
      </div>

      <div className="flex flex-col gap-0.5 border-t border-border p-2">
        <NavLink to="/settings" className={navItemClass}>
          <Settings className="h-[17px] w-[17px]" />
          {t('nav.settings')}
        </NavLink>
        <SidebarUser />
      </div>
    </aside>
  );
}
