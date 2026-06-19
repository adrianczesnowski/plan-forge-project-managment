import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Link2, Maximize2, MoreHorizontal, X } from 'lucide-react';
import type { ProjectWithRole } from '@planforge/shared';
import { useProjectTasks } from '@/entities/task/hooks/use-tasks';
import { findTaskNode } from '@/entities/task/lib/find-task-node';
import { TaskTitle } from './TaskTitle';
import { TaskMetaGrid } from './TaskMetaGrid';
import { TaskDescription } from './TaskDescription';
import { TaskSubtasks } from './TaskSubtasks';
import { TaskDependencies } from './TaskDependencies';
import { TaskActivityPanel } from './TaskActivityPanel';

interface TaskDetailModalProps {
  project: ProjectWithRole;
  taskId: string;
}

/**
 * ClickUp-style centered task modal with a deep link
 * (/projects/:id/tasks/:taskId). Closing navigates back to the project.
 */
export function TaskDetailModal({ project, taskId }: TaskDetailModalProps) {
  const { t } = useTranslation('tasks');
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

  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0f1e]/45 p-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="flex max-h-[calc(100vh_-_48px)] w-[920px] max-w-[calc(100vw_-_48px)] animate-fade-in-up flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.05)]">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-6 py-4">
          <div className="flex min-w-0 items-center gap-1.5 text-[12px] text-faint">
            <span className="truncate">{parent ? parent.title : project.name}</span>
            <span className="text-muted-foreground">›</span>
            <strong className="truncate text-foreground">{task.title}</strong>
            <span className="ml-1.5 shrink-0 font-mono text-[11px]">{task.wbsNumber}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              title={t('modal.actions.copyLink')}
              onClick={copyLink}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border text-faint transition-colors hover:bg-muted hover:text-foreground"
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
            {/* TODO: full-screen task view (deep-link to a dedicated page) */}
            <button
              type="button"
              title={t('modal.actions.fullscreen')}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border text-faint transition-colors hover:bg-muted hover:text-foreground"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            {/* TODO: task overflow menu (duplicate, move, delete…) */}
            <button
              type="button"
              title={t('modal.actions.more')}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border text-faint transition-colors hover:bg-muted hover:text-foreground"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title={t('modal.actions.close')}
              onClick={close}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border text-faint transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 space-y-6 overflow-y-auto p-6">
            <TaskTitle task={task} projectId={project.id} canEdit={canEdit} />
            <TaskMetaGrid task={task} projectId={project.id} canEdit={canEdit} />
            <TaskDescription task={task} projectId={project.id} canEdit={canEdit} />
            <TaskSubtasks task={task} projectId={project.id} canEdit={canEdit} />
            <TaskDependencies task={task} projectId={project.id} canEdit={canEdit} />
          </div>
          <div className="w-80 shrink-0 border-l border-border bg-muted/30">
            <TaskActivityPanel task={task} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
