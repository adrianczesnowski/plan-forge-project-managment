import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, MoreHorizontal } from 'lucide-react';
import type { ProjectWithRole } from '@planforge/shared';
import { useClickOutside } from '@/shared/hooks/use-click-outside';
import { ProjectDataDialog } from './ProjectDataDialog';

interface ProjectActionsMenuProps {
  project: ProjectWithRole;
}

/** Kebab menu next to the project name — entry point to project data and settings. */
export function ProjectActionsMenu({ project }: ProjectActionsMenuProps) {
  const { t } = useTranslation('projects');
  const [open, setOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false));

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title={t('menu.title')}
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-faint transition-colors hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-border bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setDataOpen(true);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted/60"
          >
            <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              <span className="block font-medium">{t('menu.data')}</span>
              <span className="block text-[11.5px] text-faint">{t('menu.dataHint')}</span>
            </span>
          </button>
        </div>
      )}

      <ProjectDataDialog project={project} open={dataOpen} onClose={() => setDataOpen(false)} />
    </div>
  );
}
