import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TaskTreeNode } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import { useUpdateTask } from '../../hooks/use-task-mutations';

interface TaskDescriptionProps {
  task: TaskTreeNode;
  projectId: string;
  canEdit: boolean;
}

/** Plain-Markdown description with click-to-edit (rendering arrives with a md library later). */
export function TaskDescription({ task, projectId, canEdit }: TaskDescriptionProps) {
  const { t } = useTranslation('tasks');
  const updateTask = useUpdateTask(projectId);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(task.description ?? '');

  useEffect(() => setValue(task.description ?? ''), [task.description]);

  const save = () => {
    setEditing(false);
    const next = value.trim() || null;
    if (next !== task.description) {
      updateTask.mutate({ taskId: task.id, input: { description: next } });
    }
  };

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold">
        <FileText className="h-[15px] w-[15px] text-faint" />
        {t('modal.description')}
      </h3>

      {editing ? (
        <textarea
          autoFocus
          value={value}
          rows={5}
          placeholder={t('modal.descriptionPlaceholder')}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setValue(task.description ?? '');
              setEditing(false);
            }
          }}
          className="w-full resize-y rounded-lg border border-primary bg-white p-3 text-[13.5px] leading-relaxed outline-none ring-2 ring-primary/10"
        />
      ) : (
        <div
          onClick={canEdit ? () => setEditing(true) : undefined}
          className={cn(
            'min-h-12 whitespace-pre-wrap rounded-lg border border-border-light bg-muted/30 px-3.5 py-3 text-[13.5px] leading-relaxed text-muted-foreground',
            canEdit && 'cursor-text transition-colors hover:border-border',
          )}
        >
          {task.description || <span className="text-faint">{t('modal.noDescription')}</span>}
        </div>
      )}
    </div>
  );
}
