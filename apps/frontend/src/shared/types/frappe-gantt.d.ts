declare module 'frappe-gantt' {
  export interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
    custom_class?: string;
    color?: string;
    color_progress?: string;
  }

  export interface GanttOptions {
    view_mode?: 'Hour' | 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Year';
    view_mode_select?: boolean;
    language?: string;
    readonly?: boolean;
    readonly_dates?: boolean;
    readonly_progress?: boolean;
    today_button?: boolean;
    infinite_padding?: boolean;
    container_height?: number | 'auto';
    bar_height?: number;
    bar_corner_radius?: number;
    padding?: number;
    column_width?: number;
    popup_on?: 'click' | 'hover';
    move_dependencies?: boolean;
    lines?: 'both' | 'vertical' | 'horizontal' | 'none';
    popup?: boolean | ((ctx: GanttPopupContext) => string | void);
    scroll_to?: 'today' | 'start' | 'end' | string;
    on_click?: (task: GanttTask) => void;
    on_date_change?: (task: GanttTask, start: Date, end: Date) => void;
    on_progress_change?: (task: GanttTask, progress: number) => void;
    on_view_change?: (mode: { name: string }) => void;
  }

  export interface GanttPopupContext {
    task: GanttTask & { _start: Date; _end: Date; actual_duration: number };
    chart: Gantt;
    set_title: (html: string) => void;
    set_subtitle: (html: string) => void;
    set_details: (html: string) => void;
  }

  export default class Gantt {
    constructor(wrapper: string | HTMLElement, tasks: GanttTask[], options?: GanttOptions);
    refresh(tasks: GanttTask[]): void;
    change_view_mode(mode?: string): void;
    update_options(options: Partial<GanttOptions>): void;
  }
}
