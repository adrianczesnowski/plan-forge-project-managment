import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TaskPriority, TaskStatus } from '@planforge/shared';
import { useProjectMembers } from '@/entities/project/hooks/use-projects';
import { cn } from '@/shared/lib/utils';
import { EMPTY_FILTERS, hasActiveFilters, type TaskFilters } from '../../model/task-filters';
import { FilterMultiSelect } from './FilterMultiSelect';

interface TaskFiltersBarProps {
  projectId: string;
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

export function TaskFiltersBar({ projectId, filters, onChange }: TaskFiltersBarProps) {
  const { t } = useTranslation('tasks');
  const { data: members } = useProjectMembers(projectId);

  const statusOptions = Object.values(TaskStatus).map((value) => ({
    value,
    label: t(`status.${value}`),
  }));
  const priorityOptions = Object.values(TaskPriority).map((value) => ({
    value,
    label: t(`priority.${value}`),
  }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
        <input
          value={filters.search}
          placeholder={t('filters.searchPlaceholder')}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-48 rounded-lg border border-border bg-transparent py-1.5 pl-8 pr-2 text-[12.5px] outline-none transition-colors placeholder:text-faint focus:border-primary"
        />
      </div>

      <FilterMultiSelect
        label={t('filters.status')}
        options={statusOptions}
        selected={filters.statuses}
        onChange={(statuses) => onChange({ ...filters, statuses })}
      />

      <FilterMultiSelect
        label={t('filters.priority')}
        options={priorityOptions}
        selected={filters.priorities}
        onChange={(priorities) => onChange({ ...filters, priorities })}
      />

      <select
        value={filters.assigneeId ?? ''}
        onChange={(e) => onChange({ ...filters, assigneeId: e.target.value || null })}
        className={cn(
          'cursor-pointer rounded-lg border px-2 py-1.5 text-[12.5px] font-medium outline-none transition-colors',
          filters.assigneeId
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-border bg-transparent text-muted-foreground',
        )}
      >
        <option value="">{t('filters.anyAssignee')}</option>
        {(members ?? []).map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.user.firstName} {member.user.lastName}
          </option>
        ))}
      </select>

      {hasActiveFilters(filters) && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
          {t('filters.clear')}
        </button>
      )}
    </div>
  );
}
