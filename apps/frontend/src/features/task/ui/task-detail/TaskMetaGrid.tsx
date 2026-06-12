import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import type { TaskTreeNode } from '@planforge/shared';
import { useAuthStore } from '@/stores/auth.store';
import { useProjectMembers } from '@/entities/project/hooks/use-projects';
import { Checkbox } from '@/shared/ui/checkbox';
import { useUpdateTask } from '../../hooks/use-task-mutations';
import { TaskStatusSelect } from '../TaskStatusSelect';
import { TaskPrioritySelect } from '../TaskPrioritySelect';

function MetaCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">{label}</span>
      <div className="flex min-h-7 items-center gap-2 text-[13px]">{children}</div>
    </div>
  );
}

const dateInputClass =
  'rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[13px] outline-none transition-colors hover:border-border focus:border-primary';

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

  const isParent = task.children.length > 0;
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

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-3">
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
        <input
          type="date"
          disabled={!canEdit || isParent}
          value={toDateInput(task.startDate)}
          onChange={(e) => update({ startDate: e.target.value || null })}
          className={dateInputClass}
        />
      </MetaCell>

      <MetaCell label={t('modal.meta.endDate')}>
        <input
          type="date"
          disabled={!canEdit || isParent}
          value={toDateInput(task.endDate)}
          min={toDateInput(task.startDate) || undefined}
          onChange={(e) => update({ endDate: e.target.value || null })}
          className={dateInputClass}
        />
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
