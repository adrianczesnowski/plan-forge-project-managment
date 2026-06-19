import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import type { TaskTreeNode } from '@planforge/shared';
import { useAuthStore } from '@/stores/auth.store';
import { useProjectMembers } from '@/entities/project/hooks/use-projects';
import { Checkbox } from '@/shared/ui/checkbox';
import { useUpdateTask } from '../../hooks/use-task-mutations';
import { TaskStatusSelect } from '../TaskStatusSelect';
import { TaskPrioritySelect } from '../TaskPrioritySelect';
import { TaskDateField } from './TaskDateField';

function MetaCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-r border-border-light px-4 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-faint">
        {label}
      </span>
      <div className="flex min-h-[26px] items-center gap-1.5 text-[13.5px] font-medium">
        {children}
      </div>
    </div>
  );
}

interface TaskMetaGridProps {
  task: TaskTreeNode;
  projectId: string;
  canEdit: boolean;
}

export function TaskMetaGrid({ task, projectId, canEdit }: TaskMetaGridProps) {
  const { t } = useTranslation('tasks');
  const updateTask = useUpdateTask(projectId);
  const currentUser = useAuthStore((s) => s.user);
  const { data: members } = useProjectMembers(projectId);

  const update = (input: Parameters<typeof updateTask.mutate>[0]['input']) =>
    updateTask.mutate({ taskId: task.id, input });

  // Explicit project members + the current user (implicit admins are not in the members table).
  const assigneeOptions = new Map<string, string>();
  if (currentUser) {
    assigneeOptions.set(currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`);
  }
  for (const member of members ?? []) {
    assigneeOptions.set(member.userId, `${member.user.firstName} ${member.user.lastName}`);
  }
  if (task.assignee) {
    assigneeOptions.set(task.assignee.id, `${task.assignee.firstName} ${task.assignee.lastName}`);
  }

  const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

  const durationDays =
    task.startDate && task.endDate
      ? differenceInCalendarDays(new Date(task.endDate), new Date(task.startDate)) + 1
      : null;

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-border [&>div:nth-child(2n)]:border-r-0 [&>div:nth-last-child(-n+2)]:border-b-0">
      <MetaCell label={t('modal.meta.status')}>
        <TaskStatusSelect
          value={task.status}
          disabled={!canEdit}
          onChange={(status) => update({ status })}
        />
      </MetaCell>

      <MetaCell label={t('modal.meta.priority')}>
        <TaskPrioritySelect
          value={task.priority}
          disabled={!canEdit}
          onChange={(priority) => update({ priority })}
        />
      </MetaCell>

      <MetaCell label={t('modal.meta.assignee')}>
        <select
          value={task.assigneeId ?? ''}
          disabled={!canEdit}
          onChange={(e) => update({ assigneeId: e.target.value || null })}
          className="max-w-full cursor-pointer appearance-none bg-transparent text-[13px] outline-none"
        >
          <option value="">{t('modal.meta.unassigned')}</option>
          {[...assigneeOptions].map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </MetaCell>

      <MetaCell label={t('modal.meta.startDate')}>
        <TaskDateField
          value={toDateInput(task.startDate)}
          disabled={!canEdit}
          onCommit={(startDate) => update({ startDate })}
        />
      </MetaCell>

      <MetaCell label={t('modal.meta.endDate')}>
        <TaskDateField
          value={toDateInput(task.endDate)}
          disabled={!canEdit}
          min={toDateInput(task.startDate) || undefined}
          onCommit={(endDate) => update({ endDate })}
        />
      </MetaCell>

      <MetaCell label={t('modal.meta.duration')}>
        {durationDays !== null ? (
          <span>{t('modal.meta.days', { count: durationDays })}</span>
        ) : (
          <span className="text-faint">—</span>
        )}
      </MetaCell>

      <MetaCell label={t('modal.meta.estimatedHours')}>
        <input
          type="number"
          min={0}
          step={0.5}
          disabled={!canEdit}
          defaultValue={task.estimatedHours ?? ''}
          onBlur={(e) => {
            const parsed = e.target.value ? Number(e.target.value) : null;
            if (parsed !== task.estimatedHours) update({ estimatedHours: parsed });
          }}
          className="w-20 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[13px] outline-none hover:border-border focus:border-primary"
        />
      </MetaCell>

      <MetaCell label={t('modal.meta.progress')}>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border-light">
          <div className="h-full rounded-full bg-accent-green" style={{ width: `${task.progress}%` }} />
        </div>
        <span className="text-[12px] text-muted-foreground">{task.progress}%</span>
      </MetaCell>

      <MetaCell label={t('modal.meta.milestone')}>
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            checked={task.isMilestone}
            disabled={!canEdit}
            onChange={(e) => update({ isMilestone: e.target.checked })}
          />
          <span className="text-[13px] text-muted-foreground">
            {task.isMilestone ? t('modal.meta.yes') : t('modal.meta.no')}
          </span>
        </label>
      </MetaCell>

      <MetaCell label={t('modal.meta.wbs')}>
        <span className="font-mono text-[13px] text-muted-foreground">{task.wbsNumber}</span>
      </MetaCell>
    </div>
  );
}
