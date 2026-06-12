import { useTranslation } from 'react-i18next';
import { TaskPriority } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  NONE: 'text-faint',
  LOW: 'text-accent-blue',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-accent-orange',
  URGENT: 'text-destructive',
};

interface TaskPrioritySelectProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
}

/** Inline select for the task priority, colored per level. */
export function TaskPrioritySelect({ value, onChange, disabled }: TaskPrioritySelectProps) {
  const { t } = useTranslation('tasks');

  return (
    <select
      value={value}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as TaskPriority)}
      className={cn(
        'cursor-pointer appearance-none bg-transparent text-[12.5px] font-medium outline-none',
        PRIORITY_STYLES[value],
        disabled && 'cursor-default',
      )}
    >
      {Object.values(TaskPriority).map((priority) => (
        <option key={priority} value={priority}>
          {t(`priority.${priority}`)}
        </option>
      ))}
    </select>
  );
}
