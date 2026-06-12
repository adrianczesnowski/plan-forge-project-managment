import { useEffect, useRef } from 'react';
import Gantt, { type GanttTask } from 'frappe-gantt';
import './gantt.css';

export type GanttViewMode = 'Day' | 'Week' | 'Month';

interface GanttChartProps {
  tasks: GanttTask[];
  viewMode: GanttViewMode;
  readonly: boolean;
  popup: (ctx: import('frappe-gantt').GanttPopupContext) => void;
  onTaskClick: (taskId: string) => void;
  onDateChange: (taskId: string, start: Date, end: Date) => void;
}

/**
 * Thin imperative wrapper: frappe-gantt owns the SVG, React owns the wrapper
 * div. Handlers go through a ref so the chart never holds stale closures.
 */
export function GanttChart({
  tasks,
  viewMode,
  readonly,
  popup,
  onTaskClick,
  onDateChange,
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<Gantt | null>(null);
  const handlersRef = useRef({ popup, onTaskClick, onDateChange });
  handlersRef.current = { popup, onTaskClick, onDateChange };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || tasks.length === 0) return;

    // Recreate on data change, preserving the horizontal scroll position.
    const previousScroll = container.querySelector('.gantt-container')?.scrollLeft;
    container.innerHTML = '';
    ganttRef.current = new Gantt(container, tasks, {
      view_mode: viewMode,
      language: 'pl',
      readonly,
      // Endless timeline in both directions — the axis never cuts off mid-screen.
      infinite_padding: true,
      today_button: false,
      view_mode_select: false,
      container_height: 'auto',
      bar_height: 26,
      padding: 16,
      popup_on: 'hover',
      popup: (ctx) => handlersRef.current.popup(ctx),
      on_click: (task) => handlersRef.current.onTaskClick(task.id),
      on_date_change: (task, start, end) => handlersRef.current.onDateChange(task.id, start, end),
    });
    if (previousScroll) {
      const scroller = container.querySelector('.gantt-container');
      if (scroller) scroller.scrollLeft = previousScroll;
    }

    return () => {
      container.innerHTML = '';
      ganttRef.current = null;
    };
    // viewMode changes go through change_view_mode below, not a rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, readonly]);

  useEffect(() => {
    ganttRef.current?.change_view_mode(viewMode);
  }, [viewMode]);

  return <div ref={containerRef} className="pf-gantt" />;
}
