import { useState } from 'react';
import { ChevronRight, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProjectWithRole } from '@planforge/shared';
import { ProjectCard } from '@/entities/project/ui/ProjectCard';
import { useToggleHidden } from '@/entities/hidden/hooks/use-hidden';
import { cn } from '@/shared/lib/utils';

/** Collapsible "Hidden" section shown below the visible project grid (default collapsed). */
export function HiddenProjectsSection({ projects }: { projects: ProjectWithRole[] }) {
  const { t } = useTranslation('settings');
  const { unhide } = useToggleHidden();
  const [open, setOpen] = useState(false);

  if (projects.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.05em] text-faint transition-colors hover:text-muted-foreground"
      >
        <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')} />
        {t('hidden.sectionTitle', { count: projects.length })}
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <div key={project.id} className="relative">
              <div className="opacity-60 transition-opacity hover:opacity-100">
                <ProjectCard project={project} />
              </div>
              <button
                type="button"
                title={t('hidden.unhide')}
                onClick={() => unhide.mutate({ entityType: 'PROJECT', entityId: project.id })}
                className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1 text-[11px] font-medium shadow-sm transition-colors hover:bg-muted"
              >
                <Eye className="h-3 w-3" />
                {t('hidden.unhide')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
