import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { ProjectWithRole } from '@planforge/shared';
import { ProjectStatusBadge } from './ProjectStatusBadge';

function formatRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  const fmt = (iso: string) => format(new Date(iso), 'd MMM yyyy');
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return fmt((start ?? end)!);
}

export function ProjectCard({ project }: { project: ProjectWithRole }) {
  const { t } = useTranslation('projects');
  const dates = formatRange(project.startDate, project.endDate);

  return (
    <Link
      to={`/projects/${project.id}`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-semibold">{project.name}</span>
        <ProjectStatusBadge status={project.status} />
      </div>

      {project.description && (
        <p className="line-clamp-2 text-[13px] text-muted-foreground">{project.description}</p>
      )}

      <div className="mt-auto flex items-center gap-1.5 text-xs text-faint">
        <CalendarDays className="h-3.5 w-3.5" />
        {dates ?? t('overview.noDates')}
      </div>
    </Link>
  );
}
