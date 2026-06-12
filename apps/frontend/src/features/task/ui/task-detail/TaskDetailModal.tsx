import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import type { ProjectWithRole } from '@planforge/shared';
import { useProjectTasks } from '@/entities/task/hooks/use-tasks';
import { findTaskNode } from '@/entities/task/lib/find-task-node';
import { TaskTitle } from './TaskTitle';
import { TaskMetaGrid } from './TaskMetaGrid';
import { TaskDescription } from './TaskDescription';
import { TaskSubtasks } from './TaskSubtasks';
import { TaskComments } from './TaskComments';

interface TaskDetailModalProps {
  project: ProjectWithRole;
  taskId: string;
}

/**
 * ClickUp-style centered task modal with a deep link
 * (/projects/:id/tasks/:taskId). Closing navigates back to the project.
 */
export function TaskDetailModal({ project, taskId }: TaskDetailModalProps) {
  const navigate = useNavigate();
  const { data: tree } = useProjectTasks(project.id);
  const canEdit = project.myRole !== 'VIEWER';

  const close = () => navigate(`/projects/${project.id}`);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  if (!tree) return null;
  const found = findTaskNode(tree, taskId);
  if (!found) return null;
  const { node: task, parent } = found;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="flex h-[85vh] w-full max-w-5xl animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <div className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <span className="truncate">{parent ? parent.title : project.name}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-faint" />
            <strong className="truncate text-foreground">{task.title}</strong>
            <span className="ml-2 shrink-0 font-mono text-[11px] text-faint">{task.wbsNumber}</span>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-5">
            <TaskTitle task={task} projectId={project.id} canEdit={canEdit} />
            <TaskMetaGrid task={task} projectId={project.id} canEdit={canEdit} />
            <TaskDescription task={task} projectId={project.id} canEdit={canEdit} />
            <TaskSubtasks task={task} projectId={project.id} canEdit={canEdit} />
          </div>
          <div className="w-80 shrink-0 border-l border-border bg-muted/20">
            <TaskComments taskId={task.id} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
