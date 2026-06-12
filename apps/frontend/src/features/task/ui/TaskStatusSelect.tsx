import { useTranslation } from 'react-i18next';
import { TaskStatus } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';

const STATUS_STYLES: Record<TaskStatus, string> = {
  TODO: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-accent-blue/10 text-accent-blue',
  IN_REVIEW: 'bg-accent-orange/10 text-accent-orange',
  DONE: 'bg-accent-green/10 text-accent-green',
  CANCELLED: 'bg-muted text-faint line-through',
};

interface TaskStatusSelectProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
}

/** Badge-looking inline select for the task status. */
export function TaskStatusSelect({ value, onChange, disabled }: TaskStatusSelectProps) {
  const { t } = useTranslation('tasks');

  return (
    <select
      value={value}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className={cn(
        'cursor-pointer appearance-none rounded-full px-2.5 py-1 text-[11.5px] font-semibold outline-none transition-colors',
        STATUS_STYLES[value],
        disabled && 'cursor-default',
      )}
    >
      {Object.values(TaskStatus).map((status) => (
        <option key={status} value={status}>
          {t(`status.${status}`)}
        </option>
      ))}
    </select>
  );
}
