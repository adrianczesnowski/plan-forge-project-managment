/**
 * MOCK dashboard data — there is no cross-project aggregation API yet.
 * TODO: replace every export here with real data once the dashboard/metrics
 * endpoints exist (active projects, my-tasks, calendar, activity feed, pulse).
 */

export interface MockProject {
  id: string;
  name: string;
  color: string;
  meta: string;
  progress: number;
  status: 'onTrack' | 'atRisk';
  avatars: { initials: string; color: string }[];
  due: string;
}

export interface MockTask {
  id: string;
  name: string;
  priorityColor: string;
  projectName: string;
  projectColor: string;
  done: boolean;
  due: { label: string; tone: 'today' | 'tomorrow' | 'overdue' | 'week' | 'done' };
}

export interface MockTimelineEvent {
  time: string;
  barColor: string;
  name: string;
  meta: string;
  type: 'meeting' | 'review' | 'deadline' | 'milestone';
}

export interface MockTimelineDay {
  label: string;
  today?: boolean;
  events: MockTimelineEvent[];
}

export interface MockActivity {
  id: string;
  initials: string;
  color: string;
  text: string;
  badge?: { label: string; tone: 'green' | 'blue' | 'orange' };
  time: string;
}

export interface MockPulse {
  id: string;
  iconBg: string;
  iconColor: string;
  icon: 'check' | 'diamond' | 'alert' | 'users';
  title: string;
  sub: string;
  badge?: { label: string; bg: string; color: string };
}

const GRAD = {
  purple: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  pink: 'linear-gradient(135deg,#f472b6,#ec4899)',
  green: 'linear-gradient(135deg,#34d399,#10b981)',
  blue: 'linear-gradient(135deg,#60a5fa,#3b82f6)',
};

export const MOCK_STATS = { projects: 7, tasksToday: 5, overdue: 1, milestones: 2 };

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: '1',
    name: 'New company website',
    color: 'var(--color-accent-purple)',
    meta: '6 phases · 19 tasks · Planning',
    progress: 32,
    status: 'onTrack',
    avatars: [
      { initials: 'MK', color: GRAD.purple },
      { initials: 'AK', color: GRAD.pink },
      { initials: 'ES', color: GRAD.green },
    ],
    due: 'Due Feb 8',
  },
  {
    id: '2',
    name: 'Brand redesign',
    color: 'var(--color-accent-orange)',
    meta: '4 phases · 12 tasks · Design',
    progress: 65,
    status: 'atRisk',
    avatars: [
      { initials: 'KM', color: GRAD.pink },
      { initials: 'MK', color: GRAD.purple },
    ],
    due: 'Due Nov 10',
  },
  {
    id: '3',
    name: 'Mobile app MVP',
    color: 'var(--color-accent-green)',
    meta: '5 phases · 24 tasks · Initiation',
    progress: 12,
    status: 'onTrack',
    avatars: [
      { initials: 'TR', color: GRAD.blue },
      { initials: 'PW', color: '#6b7280' },
    ],
    due: 'Due Mar 15',
  },
  {
    id: '4',
    name: 'CRM migration',
    color: 'var(--color-accent-blue)',
    meta: '3 phases · 16 tasks · Development',
    progress: 48,
    status: 'atRisk',
    avatars: [
      { initials: 'TR', color: GRAD.blue },
      { initials: 'MK', color: GRAD.purple },
    ],
    due: 'Due Dec 1',
  },
  {
    id: '5',
    name: 'Marketing automation',
    color: 'var(--color-accent-pink)',
    meta: '4 phases · 14 tasks · Testing',
    progress: 78,
    status: 'onTrack',
    avatars: [
      { initials: 'AK', color: GRAD.pink },
      { initials: 'ES', color: GRAD.green },
    ],
    due: 'Due Oct 31',
  },
];

export const MOCK_TASKS: MockTask[] = [
  { id: '1', name: 'Review risk assessment document', priorityColor: 'var(--color-accent-red)', projectName: 'New company website', projectColor: 'var(--color-accent-purple)', done: false, due: { label: 'overdue', tone: 'overdue' } },
  { id: '2', name: 'Approve content strategy draft', priorityColor: 'var(--color-accent-orange)', projectName: 'New company website', projectColor: 'var(--color-accent-purple)', done: false, due: { label: 'today', tone: 'today' } },
  { id: '3', name: 'Resolve data mapping conflicts', priorityColor: 'var(--color-accent-orange)', projectName: 'CRM migration', projectColor: 'var(--color-accent-blue)', done: false, due: { label: 'today', tone: 'today' } },
  { id: '4', name: 'Send brand guidelines feedback', priorityColor: 'var(--color-accent-blue)', projectName: 'Brand redesign', projectColor: 'var(--color-accent-orange)', done: false, due: { label: 'tomorrow', tone: 'tomorrow' } },
  { id: '5', name: 'Update project charter v2', priorityColor: 'var(--color-accent-green)', projectName: 'New company website', projectColor: 'var(--color-accent-purple)', done: true, due: { label: 'done', tone: 'done' } },
];

export const MOCK_TIMELINE: MockTimelineDay[] = [
  {
    label: 'Today — Oct 5',
    today: true,
    events: [
      { time: '10:00', barColor: 'var(--color-accent-blue)', name: 'CRM sync standup', meta: 'with Tomek R., Paweł W.', type: 'meeting' },
      { time: '14:00', barColor: 'var(--color-accent-purple)', name: 'Content strategy review', meta: 'New company website', type: 'review' },
    ],
  },
  {
    label: 'Tomorrow — Oct 6',
    events: [
      { time: 'EOD', barColor: 'var(--color-accent-red)', name: 'Risk assessment due', meta: 'New company website', type: 'deadline' },
    ],
  },
  {
    label: 'Fri, Oct 13',
    events: [
      { time: '—', barColor: 'var(--color-accent-purple)', name: '✦ Planning complete', meta: 'New company website', type: 'milestone' },
    ],
  },
];

export const MOCK_ACTIVITY: MockActivity[] = [
  { id: '1', initials: 'ES', color: GRAD.green, text: '<strong>Ewa S.</strong> updated <strong>Content strategy</strong> progress', badge: { label: '60%', tone: 'blue' }, time: '25 min ago' },
  { id: '2', initials: 'TR', color: GRAD.blue, text: '<strong>Tomek R.</strong> flagged <strong>CRM data migration</strong> as', badge: { label: 'blocked', tone: 'orange' }, time: '1 hour ago' },
  { id: '3', initials: 'KM', color: GRAD.pink, text: '<strong>Kasia M.</strong> uploaded 3 mood board variants to <strong>Brand redesign</strong>', time: '2 hours ago' },
  { id: '4', initials: 'AK', color: GRAD.pink, text: '<strong>Anna K.</strong> completed <strong>Stakeholder analysis</strong>', badge: { label: 'Done', tone: 'green' }, time: 'Yesterday, 14:20' },
];

export const MOCK_PULSE: MockPulse[] = [
  { id: '1', iconBg: '#f0ecff', iconColor: '#7c5cfc', icon: 'check', title: '12 tasks completed', sub: 'across 4 projects this week', badge: { label: '▲ 33%', bg: '#dcfce7', color: '#16a34a' } },
  { id: '2', iconBg: '#fef3c7', iconColor: '#d97706', icon: 'diamond', title: '2 milestones approaching', sub: 'Planning complete (8d) · Brand guidelines (13d)' },
  { id: '3', iconBg: '#fee2e2', iconColor: '#dc2626', icon: 'alert', title: '2 projects need attention', sub: 'Brand redesign (budget) · CRM migration (blocked)' },
  { id: '4', iconBg: '#dbeafe', iconColor: '#2563eb', icon: 'users', title: 'Team capacity: 74%', sub: 'Ewa S. at 95% — consider rebalancing' },
];
