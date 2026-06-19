import type { TaskStatus } from './enums';

export interface DashboardTaskCounts {
  total: number;
  done: number;
  inProgress: number;
  inReview: number;
  todo: number;
  cancelled: number;
}

export interface DashboardPhase {
  id: string;
  title: string;
  status: TaskStatus;
  progress: number;
  startDate: string | null;
  endDate: string | null;
}

export interface DashboardMilestone {
  id: string;
  title: string;
  status: TaskStatus;
  date: string | null;
  /** Days from today (negative = overdue, 0 = today). Null when undated. */
  daysLeft: number | null;
}

export interface DashboardTeamMember {
  userId: string;
  firstName: string;
  lastName: string;
  taskCount: number;
}

export type ScheduleHealth = 'ON_TRACK' | 'AT_RISK' | 'NO_DATES';

/** Aggregated project KPIs computed server-side for the project dashboard. */
export interface ProjectDashboard {
  overallProgress: number;
  taskCounts: DashboardTaskCounts;
  overdueCount: number;
  milestoneCount: number;
  scheduleHealth: ScheduleHealth;
  /** % of the project timeline elapsed (0–100), null when the project has no dates. */
  timeElapsed: number | null;
  phases: DashboardPhase[];
  milestones: DashboardMilestone[];
  team: DashboardTeamMember[];
}
