import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { ProjectWithRole } from '@planforge/shared';
import type { GanttPopupContext } from 'frappe-gantt';
import { useProjectTasks } from '@/entities/task/hooks/use-tasks';
import { useProjectDependencies } from '@/entities/dependency/hooks/use-dependencies';
import { useUpdateTask } from '@/features/task/hooks/use-task-mutations';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';
import { cn } from '@/shared/lib/utils';
import { GanttChart, type GanttViewMode } from './GanttChart';
import { buildGanttTasks } from './lib/build-gantt-tasks';

const VIEW_MODES: GanttViewMode[] = ['Day', 'Week', 'Month'];

const LEGEND: Array<{ key: 'task' | 'parent' | 'milestone' | 'critical'; swatch: string }> = [
  { key: 'task', swatch: 'bg-[#7c5cfc]' },
  { key: 'parent', swatch: 'bg-[#1a1a2e]' },
  { key: 'milestone', swatch: 'bg-[#a855f7]' },
  { key: 'critical', swatch: 'bg-[#ef4444]' },
];

export function GanttTab({ project }: { project: ProjectWithRole }) {
  const { t } = useTranslation('tasks');
  const navigate = useNavigate();
  const { data: tree, isPending: treePending } = useProjectTasks(project.id);
  const { data: dependencies, isPending: depsPending } = useProjectDependencies(project.id);
  const updateTask = useUpdateTask(project.id);
  const [viewMode, setViewMode] = useState<GanttViewMode>('Day');

  const tasks = useMemo(
    () => buildGanttTasks(tree ?? [], dependencies ?? []),
    [tree, dependencies],
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
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
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
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {t('gantt.empty')}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <GanttChart
            tasks={tasks}
            viewMode={viewMode}
            readonly={project.myRole === 'VIEWER'}
            popup={renderPopup}
            onTaskClick={(taskId) => navigate(`/projects/${project.id}/tasks/${taskId}`)}
            onDateChange={handleDateChange}
          />
        </div>
      )}
    </div>
  );
}
