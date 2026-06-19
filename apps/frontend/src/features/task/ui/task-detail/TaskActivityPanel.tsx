import { useMemo, useState } from 'react';
import { Activity, Plus, Send, Trash2, UserCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ActivityAction, type ActivityLog, type TaskTreeNode } from '@planforge/shared';
import { useAuthStore } from '@/stores/auth.store';
import { useProjectMembers } from '@/entities/project/hooks/use-projects';
import { useTaskActivity } from '@/entities/activity/hooks/use-activity';
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

/** Maps an UPDATED activity field to its action verb i18n key. */
const FIELD_ACTION: Record<string, string> = {
  status: 'changedStatus',
  priority: 'changedPriority',
  assigneeId: 'changedAssignee',
  progress: 'updatedProgress',
  title: 'renamed',
  isMilestone: 'toggledMilestone',
  startDate: 'changedStartDate',
  endDate: 'changedEndDate',
};

type Tab = 'all' | 'comments' | 'history';

export function TaskActivityPanel({ task }: { task: TaskTreeNode }) {
  const { t } = useTranslation('tasks');
  const currentUser = useAuthStore((s) => s.user);
  const { data: comments } = useTaskComments(task.id);
  const { data: activity } = useTaskActivity(task.id);
  const { data: members } = useProjectMembers(task.projectId);
  const createComment = useCreateComment(task.id);
  const deleteComment = useDeleteComment(task.id);

  const [tab, setTab] = useState<Tab>('all');
  const [content, setContent] = useState('');

  const memberName = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members ?? []) map.set(m.userId, `${m.user.firstName} ${m.user.lastName}`);
    if (task.assignee) map.set(task.assignee.id, `${task.assignee.firstName} ${task.assignee.lastName}`);
    return map;
  }, [members, task.assignee]);

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed || createComment.isPending) return;
    createComment.mutate({ content: trimmed }, { onSuccess: () => setContent('') });
  };

  /** Human-readable value of an activity field change. */
  const renderValue = (field: string | null, value: unknown): string => {
    if (value === null || value === undefined || value === '') return '—';
    switch (field) {
      case 'status':
        return t(`status.${String(value)}` as never);
      case 'priority':
        return t(`priority.${String(value)}` as never);
      case 'assigneeId':
        return memberName.get(String(value)) ?? '—';
      case 'progress':
        return `${value}%`;
      case 'isMilestone':
        return value ? t('modal.meta.yes') : t('modal.meta.no');
      case 'startDate':
      case 'endDate':
        return format(new Date(String(value)), 'd MMM yyyy');
      default:
        return String(value);
    }
  };

  const actionLabel = (log: ActivityLog): string => {
    if (log.action === ActivityAction.CREATED) return t('modal.activity.createdTask');
    if (log.action === ActivityAction.DELETED) return t('modal.activity.deletedTask');
    const key = log.field ? FIELD_ACTION[log.field] : undefined;
    return key ? t(`modal.activity.${key}` as never) : t('modal.activity.updated');
  };

  const showComments = tab === 'all' || tab === 'comments';
  const showHistory = tab === 'all' || tab === 'history';

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: t('modal.activity.all') },
    { key: 'comments', label: t('modal.activity.comments') },
    { key: 'history', label: t('modal.activity.history') },
  ];

  // Merge comments + activity into one timeline (newest first) for the "All" tab.
  type FeedItem =
    | { kind: 'comment'; id: string; date: number }
    | { kind: 'activity'; id: string; date: number; log: ActivityLog };

  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    if (showComments) {
      for (const c of comments ?? []) {
        items.push({ kind: 'comment', id: `c-${c.id}`, date: new Date(c.createdAt).getTime() });
      }
    }
    if (showHistory) {
      for (const log of activity ?? []) {
        items.push({ kind: 'activity', id: `a-${log.id}`, date: new Date(log.createdAt).getTime(), log });
      }
    }
    return items.sort((a, b) => b.date - a.date);
  }, [comments, activity, showComments, showHistory]);

  const commentById = useMemo(
    () => new Map((comments ?? []).map((c) => [c.id, c])),
    [comments],
  );

  const isEmpty = feed.length === 0;

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
        {isEmpty && (
          <p className="py-6 text-center text-[12.5px] text-faint">
            {tab === 'comments' ? t('modal.noComments') : t('modal.activity.empty')}
          </p>
        )}

        {feed.map((item, i) => {
          if (item.kind === 'comment') {
            const comment = commentById.get(item.id.slice(2));
            if (!comment) return null;
            return (
              <div key={item.id} className="group flex gap-2.5 border-b border-border-light py-2.5 last:border-b-0">
                <span
                  className="z-1 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
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
            );
          }

          const { log } = item;
          const last = i === feed.length - 1;
          const ActionIcon = log.action === ActivityAction.UPDATED && log.field === 'assigneeId' ? UserCog
            : log.action === ActivityAction.CREATED ? Plus
            : Activity;
          return (
            <div
              key={item.id}
              className={cn(
                'relative flex gap-2.5 border-b border-border-light py-2.5 last:border-b-0',
                'before:absolute before:left-[13px] before:top-[38px] before:bottom-[-10px] before:w-px before:bg-border',
                last && 'before:hidden',
              )}
            >
              <span className="z-1 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-muted text-faint">
                <ActionIcon className="h-3 w-3" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-[12.5px] font-semibold">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : t('modal.activity.system')}
                  </span>
                  <span className="text-[12.5px] text-muted-foreground">{actionLabel(log)}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-faint">
                    {format(new Date(log.createdAt), 'd MMM, HH:mm')}
                  </span>
                </div>
                {log.action === ActivityAction.UPDATED && log.field !== 'title' && (
                  <div className="mt-1 text-[12.5px]">
                    {log.oldValue !== null && log.oldValue !== undefined && (
                      <>
                        <span className="rounded bg-destructive/10 px-1.5 py-px text-[11px] text-destructive line-through">
                          {renderValue(log.field, log.oldValue)}
                        </span>
                        <span className="mx-1 text-faint">→</span>
                      </>
                    )}
                    <span className="rounded bg-accent-green/10 px-1.5 py-px text-[11px] text-accent-green">
                      {renderValue(log.field, log.newValue)}
                    </span>
                  </div>
                )}
                {log.action === ActivityAction.UPDATED && log.field === 'title' && (
                  <div className="mt-1 text-[12.5px] text-muted-foreground">
                    {renderValue(log.field, log.newValue)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
