import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import { useClickOutside } from '@/shared/hooks/use-click-outside';
import { taskApi } from '@/entities/task/api/task.api';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationRealtime,
  useNotifications,
  useUnreadCount,
} from '@/entities/notification/hooks/use-notifications';

const KNOWN_TYPES = ['TASK_ASSIGNED', 'COMMENT_MENTION', 'TASK_STATUS_CHANGED', 'DEADLINE_APPROACHING'];

export function NotificationBell() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false));

  useNotificationRealtime();
  const { data: notifications } = useNotifications();
  const { data: unread } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const count = unread?.count ?? 0;

  const typeLabel = (type: string) =>
    KNOWN_TYPES.includes(type) ? t(`notifications.type.${type}` as never) : type;

  const open_ = async (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id);
    setOpen(false);
    if (n.entityType === 'task' && n.entityId) {
      try {
        const task = await taskApi.getById(n.entityId);
        navigate(`/projects/${task.projectId}/tasks/${n.entityId}`);
      } catch {
        /* task may have been deleted — ignore */
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
        title={t('notifications.title')}
      >
        <Bell className="h-[15px] w-[15px]" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-80 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-[13px] font-semibold">{t('notifications.title')}</span>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="flex items-center gap-1 text-[11.5px] text-accent-purple hover:text-primary-hover"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <p className="py-10 text-center text-[12.5px] text-faint">{t('notifications.empty')}</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => void open_(n)}
                  className={cn(
                    'flex w-full items-start gap-2.5 border-b border-border-light px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/50',
                    !n.isRead && 'bg-primary/5',
                  )}
                >
                  {!n.isRead ? (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-purple" />
                  ) : (
                    <span className="mt-1.5 h-2 w-2 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium text-muted-foreground">{typeLabel(n.type)}</div>
                    <div className="truncate text-[13px] font-medium text-foreground">{n.title}</div>
                    <div className="mt-0.5 text-[11px] text-faint">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
