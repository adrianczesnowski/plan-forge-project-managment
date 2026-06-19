import { useState } from 'react';
import { Activity, Send, Trash2, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { TaskTreeNode } from '@planforge/shared';
import { useAuthStore } from '@/stores/auth.store';
import {
  useCreateComment,
  useDeleteComment,
  useTaskComments,
} from '@/entities/comment/hooks/use-comments';
import { cn } from '@/shared/lib/utils';

const AVATAR_COLORS = ['#7c5cfc', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6'];

function avatarColor(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

type Tab = 'all' | 'comments' | 'history';

/**
 * ClickUp-style activity timeline. Comments are live; the system events
 * (status / progress / assignment / creation) are mocked for now.
 * TODO: replace the mocked history with a real activity-log API (see roadmap "Activity log").
 */
export function TaskActivityPanel({ task }: { task: TaskTreeNode }) {
  const { t } = useTranslation('tasks');
  const currentUser = useAuthStore((s) => s.user);
  const { data: comments } = useTaskComments(task.id);
  const createComment = useCreateComment(task.id);
  const deleteComment = useDeleteComment(task.id);

  const [tab, setTab] = useState<Tab>('all');
  const [content, setContent] = useState('');

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed || createComment.isPending) return;
    createComment.mutate({ content: trimmed }, { onSuccess: () => setContent('') });
  };

  // TODO: mocked system activity — swap for the activity-log API once it exists.
  const mockHistory = [
    {
      id: 'mock-status',
      author: task.assignee
        ? `${task.assignee.firstName} ${task.assignee.lastName}`
        : 'Marcin K.',
      action: t('modal.activity.changedStatus'),
      time: format(new Date(task.updatedAt), 'd MMM, HH:mm'),
      from: t('status.IN_PROGRESS'),
      to: t(`status.${task.status}`),
    },
    {
      id: 'mock-created',
      author: 'Anna K.',
      action: t('modal.activity.createdTask'),
      time: format(new Date(task.createdAt), 'd MMM, HH:mm'),
      from: null,
      to: null,
    },
  ];

  const showComments = tab === 'all' || tab === 'comments';
  const showHistory = tab === 'all' || tab === 'history';

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: t('modal.activity.all') },
    { key: 'comments', label: t('modal.activity.comments') },
    { key: 'history', label: t('modal.activity.history') },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex shrink-0 border-b border-border">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 border-b-2 px-4 py-3 text-center text-[12.5px] font-semibold transition-colors',
              tab === key
                ? 'border-accent-purple text-foreground'
                : 'border-transparent text-faint hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {showHistory && (
          <p className="mb-2 rounded-md bg-accent-orange/10 px-2 py-1 text-[10.5px] font-medium text-accent-orange">
            {t('modal.activity.demo')}
          </p>
        )}

        {showComments &&
          comments?.map((comment) => (
            <div
              key={comment.id}
              className="group relative flex gap-2.5 border-b border-border-light py-2.5 last:border-b-0"
            >
              <span
                className="z-[1] flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: avatarColor(comment.authorId) }}
              >
                {initials(comment.author.firstName, comment.author.lastName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[12.5px] font-semibold">
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] text-faint">
                    {format(new Date(comment.createdAt), 'd MMM, HH:mm')}
                  </span>
                  {comment.authorId === currentUser?.id && (
                    <button
                      type="button"
                      title={t('modal.deleteComment')}
                      onClick={() => deleteComment.mutate(comment.id)}
                      className="hidden h-5 w-5 items-center justify-center rounded text-faint hover:text-destructive group-hover:flex"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="mt-1.5 whitespace-pre-wrap rounded-lg border border-border bg-white px-3 py-2 text-[12.5px] leading-relaxed">
                  {comment.content}
                </div>
              </div>
            </div>
          ))}

        {showComments && comments?.length === 0 && tab === 'comments' && (
          <p className="py-6 text-center text-[12.5px] text-faint">{t('modal.noComments')}</p>
        )}

        {showHistory &&
          mockHistory.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                'relative flex gap-2.5 border-b border-border-light py-2.5 last:border-b-0',
                'before:absolute before:left-[13px] before:top-[38px] before:bottom-[-10px] before:w-px before:bg-border',
                i === mockHistory.length - 1 && 'before:hidden',
              )}
            >
              <span className="z-[1] flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-muted text-faint">
                {item.from ? <Activity className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-[12.5px] font-semibold">{item.author}</span>
                  <span className="text-[12.5px] text-muted-foreground">{item.action}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-faint">{item.time}</span>
                </div>
                {item.from && (
                  <div className="mt-1 text-[12.5px]">
                    <span className="rounded bg-destructive/10 px-1.5 py-px text-[11px] text-destructive line-through">
                      {item.from}
                    </span>
                    <span className="mx-1 text-faint">→</span>
                    <span className="rounded bg-accent-green/10 px-1.5 py-px text-[11px] text-accent-green">
                      {item.to}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Comment input */}
      <div className="flex shrink-0 items-end gap-2 border-t border-border p-3">
        {currentUser && (
          <span
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: avatarColor(currentUser.id) }}
          >
            {initials(currentUser.firstName, currentUser.lastName)}
          </span>
        )}
        <textarea
          value={content}
          rows={1}
          placeholder={t('modal.commentPlaceholder')}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
          className="min-h-9 flex-1 resize-none rounded-lg border border-border bg-white px-2.5 py-2 text-[12.5px] outline-none transition-colors focus:border-primary"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!content.trim() || createComment.isPending}
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md bg-accent-purple text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
