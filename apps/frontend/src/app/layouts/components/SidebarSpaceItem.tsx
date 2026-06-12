import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SpaceWithRole } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import { useSpaceProjects } from '@/entities/project/hooks/use-projects';

const PROJECT_DOT_FALLBACK = '#9ca3af';

/** Space entry with a lazy-loaded, collapsible list of its projects. */
export function SidebarSpaceItem({ space }: { space: SpaceWithRole }) {
  const { t } = useTranslation('projects');
  const [expanded, setExpanded] = useState(false);
  // Projects are fetched only after the first expand.
  const { data: projects, isPending } = useSpaceProjects(space.id, expanded);

  return (
    <div>
      <div className="group flex items-center">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex h-6 w-5 shrink-0 items-center justify-center text-faint transition-colors hover:text-foreground"
        >
          <ChevronRight
            className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-90')}
          />
        </button>
        <NavLink
          to={`/spaces/${space.id}`}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-1 items-center gap-2 rounded-[7px] px-1.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              isActive && 'bg-muted font-semibold text-foreground',
            )
          }
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: space.color ?? PROJECT_DOT_FALLBACK }}
          />
          <span className="truncate">{space.name}</span>
        </NavLink>
      </div>

      {expanded && (
        <div className="ml-[18px] flex flex-col gap-0.5 border-l border-border pl-2">
          {isPending && (
            <span className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-faint">
              <Loader2 className="h-3 w-3 animate-spin" />
            </span>
          )}
          {projects?.map((project) => (
            <NavLink
              key={project.id}
              to={`/projects/${project.id}`}
              className={({ isActive }) =>
                cn(
                  'truncate rounded-[7px] px-2 py-1 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  isActive && 'bg-muted font-semibold text-foreground',
                )
              }
            >
              {project.name}
            </NavLink>
          ))}
          {projects?.length === 0 && (
            <span className="px-2 py-1 text-[12px] italic text-faint">{t('sidebarEmpty')}</span>
          )}
        </div>
      )}
    </div>
  );
}
