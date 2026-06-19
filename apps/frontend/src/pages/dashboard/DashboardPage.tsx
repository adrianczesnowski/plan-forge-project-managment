import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCheck,
  CheckSquare,
  Clock,
  FolderKanban,
  Gem,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useCurrentOrganization } from '@/entities/organization/hooks/use-current-organization';
import { cn } from '@/shared/lib/utils';
import {
  MOCK_ACTIVITY,
  MOCK_PROJECTS,
  MOCK_PULSE,
  MOCK_STATS,
  MOCK_TASKS,
  MOCK_TIMELINE,
} from './lib/dashboard-mock';

const DUE_TONE: Record<string, string> = {
  today: 'bg-accent-purple/15 text-accent-purple',
  tomorrow: 'bg-accent-blue/10 text-accent-blue',
  overdue: 'bg-destructive/10 text-destructive',
  done: 'bg-muted text-faint',
  week: 'bg-muted text-faint',
};

const TL_TONE: Record<string, string> = {
  meeting: 'bg-accent-blue/10 text-accent-blue',
  review: 'bg-accent-orange/10 text-accent-orange',
  deadline: 'bg-destructive/10 text-destructive',
  milestone: 'bg-accent-purple/15 text-accent-purple',
};

const ACT_TONE: Record<string, string> = {
  green: 'bg-accent-green/10 text-accent-green',
  blue: 'bg-accent-blue/10 text-accent-blue',
  orange: 'bg-accent-orange/10 text-accent-orange',
};

const PULSE_ICON: Record<string, LucideIcon> = {
  check: CheckCheck,
  diamond: Gem,
  alert: AlertTriangle,
  users: Users,
};

function Card({
  title,
  icon: Icon,
  action,
  className,
  children,
}: {
  title: string;
  icon: LucideIcon;
  action?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.05em] text-faint">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        {action && (
          <button type="button" className="text-[12px] font-semibold text-accent-purple hover:text-primary-hover">
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Avatar({ initials, color, size = 24 }: { initials: string; color: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-white font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.34, background: color }}
    >
      {initials}
    </span>
  );
}

export function DashboardPage() {
  const { t, i18n } = useTranslation('dashboard');
  const user = useAuthStore((s) => s.user);
  const { data: organization } = useCurrentOrganization();

  const now = new Date();
  const hour = now.getHours();
  const slot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const dateLabel = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'full' }).format(now);

  const stats = [
    { value: MOCK_STATS.projects, label: t('stats.projects'), color: 'var(--color-accent-purple)' },
    { value: MOCK_STATS.tasksToday, label: t('stats.tasksToday'), color: 'var(--color-accent-blue)' },
    { value: MOCK_STATS.overdue, label: t('stats.overdue'), color: 'var(--color-accent-red)' },
    { value: MOCK_STATS.milestones, label: t('stats.milestones'), color: 'var(--color-accent-green)' },
  ];

  return (
    <div className="px-7 pb-10 pt-7">
      {/* Greeting */}
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold leading-tight">
            {t(`greeting.${slot}`, { name: user?.firstName ?? '' })} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('greeting.sub')}</p>
          <p className="mt-0.5 text-[13px] capitalize text-faint">
            {dateLabel}
            {organization && ` · ${organization.name}`}
          </p>
        </div>
        {/* TODO: real aggregated counts from a dashboard metrics endpoint. */}
        <div className="hidden gap-2.5 md:flex">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex min-w-[90px] flex-col items-center rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="text-[22px] font-bold leading-none" style={{ color: s.color }}>
                {s.value}
              </span>
              <span className="mt-1 text-center text-[10.5px] font-medium uppercase tracking-[0.03em] text-faint">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Projects */}
      {/* TODO: replace MOCK_PROJECTS with real org-wide active projects. */}
      <Card title={t('cards.activeProjects')} icon={FolderKanban} action={t('actions.viewAll')} className="mb-5">
        <div className="flex gap-3.5 overflow-x-auto pb-1">
          {MOCK_PROJECTS.map((p) => (
            <div
              key={p.id}
              className="relative w-[240px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-card p-[18px] transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: p.color }} />
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded" style={{ background: p.color }} />
                <span className="text-sm font-bold leading-snug">{p.name}</span>
              </div>
              <p className="mb-3.5 text-[11.5px] text-faint">{p.meta}</p>
              <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-border-light">
                <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.color }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold" style={{ color: p.color }}>
                  {p.progress}%
                </span>
                <span
                  className={cn(
                    'rounded-[10px] px-2 py-0.5 text-[10.5px] font-semibold',
                    p.status === 'onTrack'
                      ? 'bg-accent-green/10 text-accent-green'
                      : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {t(`projStatus.${p.status}`)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border-light pt-2.5">
                <div className="flex">
                  {p.avatars.map((a, i) => (
                    <span key={i} className={i > 0 ? '-ml-1.5' : ''}>
                      <Avatar initials={a.initials} color={a.color} size={24} />
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-faint">{p.due}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* My Tasks */}
        {/* TODO: replace MOCK_TASKS with the current user's tasks across projects. */}
        <Card title={t('cards.myTasks')} icon={CheckSquare} action={t('actions.allTasks')}>
          <div className="flex flex-col">
            {MOCK_TASKS.map((task) => (
              <div key={task.id} className="flex items-center gap-3 border-b border-border-light py-2.5 last:border-b-0">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: task.priorityColor }} />
                <span
                  className={cn(
                    'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2',
                    task.done ? 'border-accent-green bg-accent-green text-white' : 'border-border',
                  )}
                >
                  {task.done && <CheckCheck className="h-3 w-3" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={cn('text-[13px] font-medium leading-snug', task.done && 'text-faint line-through')}>
                    {task.name}
                  </div>
                  <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-faint">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: task.projectColor }} />
                    {task.projectName}
                  </div>
                </div>
                <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-[11.5px] font-medium', DUE_TONE[task.due.tone])}>
                  {t(`due.${task.due.label}` as never)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Coming Up */}
        {/* TODO: replace MOCK_TIMELINE with real upcoming events / deadlines / milestones. */}
        <Card title={t('cards.comingUp')} icon={Calendar} action={t('actions.calendar')}>
          <div className="flex flex-col">
            {MOCK_TIMELINE.map((day) => (
              <div key={day.label} className="border-b border-border-light py-2.5 last:border-b-0">
                <div
                  className={cn(
                    'mb-2 text-[11px] font-bold uppercase tracking-[0.04em]',
                    day.today ? 'text-accent-purple' : 'text-faint',
                  )}
                >
                  {day.label}
                </div>
                {day.events.map((e, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-1.5">
                    <span className="min-w-[48px] text-[11px] font-medium text-faint">{e.time}</span>
                    <span className="h-7 w-[3px] shrink-0 rounded-sm" style={{ background: e.barColor }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold">{e.name}</div>
                      <div className="text-[11px] text-faint">{e.meta}</div>
                    </div>
                    <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold', TL_TONE[e.type])}>
                      {t(`tlType.${e.type}`)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        {/* TODO: replace MOCK_ACTIVITY with the real org-wide activity feed. */}
        <Card title={t('cards.recentActivity')} icon={Clock} action={t('actions.allActivity')}>
          <div className="flex flex-col">
            {MOCK_ACTIVITY.map((a, i) => (
              <div
                key={a.id}
                className={cn(
                  'relative flex gap-2.5 border-b border-border-light py-2.5 last:border-b-0',
                  'before:absolute before:left-3 before:top-[34px] before:bottom-[-9px] before:w-px before:bg-border-light',
                  i === MOCK_ACTIVITY.length - 1 && 'before:hidden',
                )}
              >
                <span className="z-1">
                  <Avatar initials={a.initials} color={a.color} size={24} />
                </span>
                <div className="flex-1">
                  <div
                    className="text-[12.5px] leading-snug text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground"
                    dangerouslySetInnerHTML={{
                      __html: a.badge
                        ? `${a.text} <span class="inline-block rounded px-1.5 py-px text-[10.5px] font-medium ${ACT_TONE[a.badge.tone]}">${a.badge.label}</span>`
                        : a.text,
                    }}
                  />
                  <div className="mt-0.5 text-[10.5px] text-faint">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* This Week's Pulse */}
        {/* TODO: replace MOCK_PULSE with real weekly metrics. */}
        <Card title={t('cards.pulse')} icon={Activity}>
          <div className="flex flex-col gap-3">
            {MOCK_PULSE.map((p) => {
              const Icon = PULSE_ICON[p.icon] ?? Activity;
              return (
                <div key={p.id} className="flex items-center gap-3.5 rounded-[10px] bg-muted/40 px-3.5 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]" style={{ background: p.iconBg }}>
                    <Icon className="h-5 w-5" style={{ color: p.iconColor }} />
                  </span>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{p.title}</div>
                    <div className="text-[11.5px] text-faint">{p.sub}</div>
                  </div>
                  {p.badge && (
                    <span
                      className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold"
                      style={{ background: p.badge.bg, color: p.badge.color }}
                    >
                      {p.badge.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Demo-data notice */}
      <p className="mt-6 text-center text-[11px] text-faint">{t('demo')}</p>
    </div>
  );
}
