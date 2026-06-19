import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import type { ProjectWithRole } from '@planforge/shared';
import type { GanttPopupContext } from 'frappe-gantt';
import { useProjectTasks } from '@/entities/task/hooks/use-tasks';
import { useProjectDependencies } from '@/entities/dependency/hooks/use-dependencies';
import { useUpdateTask } from '@/features/task/hooks/use-task-mutations';
import { filterTaskTree, type TaskFilters } from '@/features/task/model/task-filters';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';
import { cn } from '@/shared/lib/utils';
import { GanttChart, type GanttChartHandle, type GanttViewMode } from './GanttChart';
import { buildGanttTasks } from './lib/build-gantt-tasks';

const VIEW_MODES: GanttViewMode[] = ['Day', 'Week', 'Month'];

const LEGEND: Array<{ key: 'task' | 'parent' | 'milestone' | 'critical'; swatch: string }> = [
  { key: 'task', swatch: 'bg-[#7c5cfc]' },
  { key: 'parent', swatch: 'bg-[#1a1a2e]' },
  { key: 'milestone', swatch: 'bg-[#a855f7]' },
  { key: 'critical', swatch: 'bg-[#ef4444]' },
];

interface GanttTabProps {
  project: ProjectWithRole;
  filters: TaskFilters;
}

export function GanttTab({ project, filters }: GanttTabProps) {
  const { t } = useTranslation('tasks');
  const navigate = useNavigate();
  const { data: tree, isPending: treePending } = useProjectTasks(project.id);
  const { data: dependencies, isPending: depsPending } = useProjectDependencies(project.id);
  const updateTask = useUpdateTask(project.id);
  const chartRef = useRef<GanttChartHandle>(null);
  const [viewMode, setViewMode] = useState<GanttViewMode>('Day');

  const { tasks, classMap } = useMemo(
    () => buildGanttTasks(filterTaskTree(tree ?? [], filters), dependencies ?? []),
    [tree, dependencies, filters],
  );

  if (treePending || depsPending) return <FullPageSpinner />;

  const handleDateChange = (taskId: string, start: Date, end: Date) => {
    updateTask.mutate({
      taskId,
      input: { startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') },
    });
  };

  const renderPopup = (ctx: GanttPopupContext) => {
    ctx.set_title(ctx.task.name);
    ctx.set_subtitle('');
    // frappe-gantt keeps _end exclusive (start of the next day) — show the inclusive day.
    const inclusiveEnd = new Date(ctx.task._end.getTime() - 1000);
    const range = `${format(ctx.task._start, 'd MMM yyyy')} – ${format(inclusiveEnd, 'd MMM yyyy')}`;
    ctx.set_details(`${range}<br/>${t('gantt.popupProgress')}: ${Math.round(ctx.task.progress)}%`);
  };

  return (
    <div className="space-y-3 px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  'rounded-md px-3 py-1 text-[12.5px] font-medium transition-colors',
                  viewMode === mode
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`gantt.viewMode.${mode}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => chartRef.current?.scrollToday()}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {t('gantt.today')}
          </button>
        </div>

        <div className="flex items-center gap-4">
          {LEGEND.map(({ key, swatch }) => (
            <span key={key} className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <span className={cn('h-2.5 w-2.5 rounded-sm', swatch)} />
              {t(`gantt.legend.${key}`)}
            </span>
          ))}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">{t('gantt.empty')}</div>
      ) : (
        <GanttChart
          ref={chartRef}
          tasks={tasks}
          classMap={classMap}
          viewMode={viewMode}
          readonly={project.myRole === 'VIEWER'}
          popup={renderPopup}
          onTaskClick={(taskId) => navigate(`/projects/${project.id}/tasks/${taskId}`)}
          onDateChange={handleDateChange}
        />
      )}
    </div>
  );
}
