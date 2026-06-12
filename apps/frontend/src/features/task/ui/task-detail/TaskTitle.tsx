import { useEffect, useState } from 'react';
import type { TaskTreeNode } from '@planforge/shared';
import { useUpdateTask } from '../../hooks/use-task-mutations';

interface TaskTitleProps {
  task: TaskTreeNode;
  projectId: string;
  canEdit: boolean;
}

/** Inline-editable task title (click → input, Enter/blur saves, Esc cancels). */
export function TaskTitle({ task, projectId, canEdit }: TaskTitleProps) {
  const updateTask = useUpdateTask(projectId);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(task.title);

  useEffect(() => setValue(task.title), [task.title]);

  const save = () => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== task.title) {
      updateTask.mutate({ taskId: task.id, input: { title: trimmed } });
    } else {
      setValue(task.title);
    }
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') {
            setValue(task.title);
            setEditing(false);
          }
        }}
        className="w-full rounded-md border border-primary bg-white px-2 py-1 text-xl font-bold tracking-tight outline-none ring-2 ring-primary/10"
      />
    );
  }

  return (
    <h2
      onClick={canEdit ? () => setEditing(true) : undefined}
      className={
        canEdit
          ? 'cursor-text rounded-md px-2 py-1 text-xl font-bold tracking-tight hover:bg-muted'
          : 'px-2 py-1 text-xl font-bold tracking-tight'
      }
    >
      {task.title}
    </h2>
  );
}
