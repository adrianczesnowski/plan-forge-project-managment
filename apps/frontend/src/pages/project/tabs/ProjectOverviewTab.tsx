import { CalendarDays, ListTodo } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { ProjectWithRole } from '@planforge/shared';

function DateBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-[11.5px] font-semibold uppercase tracking-wide text-faint">{label}</div>
      <div className="mt-0.5 text-sm font-medium">
        {value ? format(new Date(value), 'd MMM yyyy') : '—'}
      </div>
    </div>
  );
}

export function ProjectOverviewTab({ project }: { project: ProjectWithRole }) {
  const { t } = useTranslation('projects');

  return (
    <div className="grid max-w-4xl gap-4 p-6 sm:grid-cols-2">
      <div className="rounded-xl border border-border bg-white p-4">
        <h2 className="mb-2 text-[13px] font-semibold text-muted-foreground">
          {t('overview.description')}
        </h2>
        <p className="text-sm leading-relaxed">
          {project.description || (
            <span className="text-faint">{t('overview.noDescription')}</span>
          )}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          {t('overview.dates')}
        </h2>
        <div className="flex gap-10">
          <DateBlock label={t('create.startDateLabel')} value={project.startDate} />
          <DateBlock label={t('create.endDateLabel')} value={project.endDate} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center sm:col-span-2">
        <ListTodo className="h-8 w-8 text-faint" />
        <p className="text-sm font-medium text-muted-foreground">{t('overview.tasksSoon')}</p>
        <p className="text-[13px] text-faint">{t('overview.tasksSoonHint')}</p>
      </div>
    </div>
  );
}
