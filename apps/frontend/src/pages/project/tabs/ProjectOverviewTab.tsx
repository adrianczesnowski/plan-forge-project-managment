import { Activity, CheckCheck, Gem, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { DashboardMilestone, ProjectDashboard, ProjectWithRole } from '@planforge/shared';
import { useProjectDashboard } from '@/entities/dashboard/hooks/use-dashboard';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';
import { cn } from '@/shared/lib/utils';

const PHASE_COLORS = ['#7c5cfc', '#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#ec4899'];

const AVATAR_COLORS = ['#7c5cfc', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6'];
function avatarColor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4">
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} />
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-faint">{label}</div>
      <div className="mt-1.5 text-2xl font-bold leading-none">{value}</div>
      {sub && <div className="mt-1.5 text-[11.5px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function CardTitle({ icon: Icon, children }: { icon: typeof Activity; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.05em] text-faint">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

function fmtDate(value: string | null): string {
  return value ? format(new Date(value), 'd MMM yyyy') : '—';
}

function MilestoneRow({
  milestone,
  color,
  t,
}: {
  milestone: DashboardMilestone;
  color: string;
  t: ReturnType<typeof useTranslation<'projects'>>['t'];
}) {
  let badge: { text: string; cls: string };
  if (milestone.status === 'DONE') {
    badge = { text: t('dashboard.milestoneDone'), cls: 'bg-accent-green/10 text-accent-green' };
  } else if (milestone.daysLeft === null) {
    badge = { text: '—', cls: 'bg-muted text-faint' };
  } else if (milestone.daysLeft < 0) {
    badge = {
      text: t('dashboard.overdueBy', { count: Math.abs(milestone.daysLeft) }),
      cls: 'bg-destructive/10 text-destructive',
    };
  } else if (milestone.daysLeft === 0) {
    badge = { text: t('dashboard.dueToday'), cls: 'bg-accent-orange/10 text-accent-orange' };
  } else {
    badge = {
      text: t('dashboard.daysLeft', { count: milestone.daysLeft }),
      cls: milestone.daysLeft <= 14 ? 'bg-accent-blue/10 text-accent-blue' : 'bg-muted text-muted-foreground',
    };
  }
  return (
    <div className="flex items-center gap-3 border-b border-border-light py-2.5 last:border-b-0">
      <Gem className="h-4 w-4 shrink-0" style={{ color }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{milestone.title}</div>
        <div className="text-[11.5px] text-faint">{fmtDate(milestone.date)}</div>
      </div>
      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', badge.cls)}>
        {badge.text}
      </span>
    </div>
  );
}

function DashboardBody({ data, t }: { data: ProjectDashboard; t: ReturnType<typeof useTranslation<'projects'>>['t'] }) {
  const { taskCounts: c } = data;
  const healthTone =
    data.scheduleHealth === 'ON_TRACK'
      ? 'text-accent-green'
      : data.scheduleHealth === 'AT_RISK'
        ? 'text-destructive'
        : 'text-muted-foreground';

  const maxLoad = Math.max(1, ...data.team.map((m) => m.taskCount));

  const statusBars: { key: string; count: number; color: string }[] = [
    { key: 'done', count: c.done, color: 'var(--color-accent-green)' },
    { key: 'inProgress', count: c.inProgress, color: 'var(--color-accent-blue)' },
    { key: 'inReview', count: c.inReview, color: 'var(--color-accent-orange)' },
    { key: 'todo', count: c.todo, color: 'var(--color-faint)' },
    { key: 'cancelled', count: c.cancelled, color: '#cbd5e1' },
  ];

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          label={t('dashboard.kpi.overallProgress')}
          value={`${data.overallProgress}%`}
          sub={data.timeElapsed !== null ? t('dashboard.timeElapsed', { value: data.timeElapsed }) : undefined}
          accent="var(--color-accent-purple)"
        />
        <KpiCard
          label={t('dashboard.kpi.tasksCompleted')}
          value={
            <>
              {c.done}
              <span className="text-base font-semibold text-faint"> / {c.total}</span>
            </>
          }
          sub={t('dashboard.tasksBreakdown', { inProgress: c.inProgress, todo: c.todo })}
          accent="var(--color-accent-green)"
        />
        <KpiCard
          label={t('dashboard.kpi.scheduleHealth')}
          value={<span className={cn('text-lg', healthTone)}>{t(`dashboard.health.${data.scheduleHealth}`)}</span>}
          accent="var(--color-accent-blue)"
        />
        <KpiCard
          label={t('dashboard.kpi.overdue')}
          value={<span className={data.overdueCount > 0 ? 'text-destructive' : undefined}>{data.overdueCount}</span>}
          accent="var(--color-accent-orange)"
        />
        <KpiCard
          label={t('dashboard.kpi.milestones')}
          value={data.milestoneCount}
          accent="var(--color-accent-pink)"
        />
      </div>

      {/* Phase progress */}
      <div className="rounded-xl border border-border bg-card p-5">
        <CardTitle icon={Activity}>{t('dashboard.phaseProgress')}</CardTitle>
        {data.phases.length === 0 ? (
          <p className="text-[13px] text-faint">{t('dashboard.noPhases')}</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {data.phases.map((phase, i) => {
              const color = PHASE_COLORS[i % PHASE_COLORS.length]!;
              return (
                <div key={phase.id} className="min-w-[180px] flex-1 rounded-lg border border-border-light p-3">
                  <div className="truncate text-[13px] font-semibold">{phase.title}</div>
                  <div className="mt-0.5 text-[11px] text-faint">
                    {fmtDate(phase.startDate)} – {fmtDate(phase.endDate)}
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-light">
                    <div className="h-full rounded-full" style={{ width: `${phase.progress}%`, background: color }} />
                  </div>
                  <div className="mt-1 text-[12px] font-bold" style={{ color }}>
                    {phase.progress}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Milestones */}
        <div className="rounded-xl border border-border bg-card p-5">
          <CardTitle icon={Gem}>{t('dashboard.upcomingMilestones')}</CardTitle>
          {data.milestones.length === 0 ? (
            <p className="text-[13px] text-faint">{t('dashboard.noMilestones')}</p>
          ) : (
            <div className="flex flex-col">
              {data.milestones.map((m, i) => (
                <MilestoneRow key={m.id} milestone={m} color={PHASE_COLORS[i % PHASE_COLORS.length]!} t={t} />
              ))}
            </div>
          )}
        </div>

        {/* Team */}
        <div className="rounded-xl border border-border bg-card p-5">
          <CardTitle icon={Users}>{t('dashboard.team')}</CardTitle>
          {data.team.length === 0 ? (
            <p className="text-[13px] text-faint">{t('dashboard.noTeam')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.team.map((m) => {
                const pct = Math.round((m.taskCount / maxLoad) * 100);
                const load = pct >= 80 ? 'var(--color-destructive)' : pct >= 50 ? 'var(--color-accent-orange)' : 'var(--color-accent-green)';
                return (
                  <div key={m.userId} className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: avatarColor(m.userId) }}
                    >
                      {m.firstName.charAt(0)}
                      {m.lastName.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">
                        {m.firstName} {m.lastName}
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border-light">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: load }} />
                      </div>
                    </div>
                    <span className="shrink-0 text-[11.5px] text-muted-foreground">
                      {t('dashboard.taskCount', { count: m.taskCount })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="rounded-xl border border-border bg-card p-5">
        <CardTitle icon={CheckCheck}>{t('dashboard.statusBreakdown')}</CardTitle>
        <div className="flex h-3 overflow-hidden rounded-full bg-border-light">
          {statusBars
            .filter((s) => s.count > 0)
            .map((s) => (
              <div
                key={s.key}
                style={{ width: `${(s.count / Math.max(1, c.total)) * 100}%`, background: s.color }}
                title={`${s.count}`}
              />
            ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
          {statusBars.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {t(`dashboard.status.${s.key}` as never)}
              <strong className="font-semibold text-foreground">{s.count}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProjectOverviewTab({ project }: { project: ProjectWithRole }) {
  const { t } = useTranslation('projects');
  const { data, isPending } = useProjectDashboard(project.id);

  return (
    <div className="space-y-5 px-6 py-5">
      {/* Description + schedule header */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <h2 className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-faint">
            {t('overview.description')}
          </h2>
          <p className="text-sm leading-relaxed">
            {project.description || <span className="text-faint">{t('overview.noDescription')}</span>}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-faint">
            {t('overview.dates')}
          </h2>
          <p className="text-sm font-medium">
            {fmtDate(project.startDate)} – {fmtDate(project.endDate)}
          </p>
        </div>
      </div>

      {isPending || !data ? <FullPageSpinner /> : <DashboardBody data={data} t={t} />}
    </div>
  );
}
