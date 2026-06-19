import * as XLSX from 'xlsx';
import { TaskPriority, TaskStatus, type TaskTreeNode } from '@planforge/shared';
import { flattenTree } from '@/entities/task/lib/flatten-tree';

export type TransferFormat = 'csv' | 'xlsx';

/** Canonical column headers written on export (machine-stable, locale-independent). */
const HEADERS = [
  'WBS',
  'Title',
  'Description',
  'Status',
  'Priority',
  'Start Date',
  'End Date',
  'Progress',
  'Milestone',
] as const;

/** Logical columns and the header aliases (EN + PL, lowercased) accepted on import. */
const COLUMN_ALIASES: Record<string, string[]> = {
  wbs: ['wbs', 'wbs#', 'nr', 'numer'],
  title: ['title', 'tytuł', 'tytul', 'nazwa', 'name'],
  description: ['description', 'opis'],
  status: ['status'],
  priority: ['priority', 'priorytet'],
  startDate: ['start date', 'startdate', 'start', 'data startu', 'data rozpoczęcia', 'data rozpoczecia'],
  endDate: ['end date', 'due date', 'duedate', 'enddate', 'termin', 'data końca', 'data konca', 'data zakończenia', 'data zakonczenia'],
  progress: ['progress', 'postęp', 'postep'],
  milestone: ['milestone', 'kamień milowy', 'kamien milowy'],
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function isoDay(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

/** Downloads every task (WBS order) as a CSV or XLSX file. */
export function exportTasks(tree: TaskTreeNode[], format: TransferFormat, baseName: string): void {
  const flat = flattenTree(tree);
  const aoa: (string | number)[][] = [
    [...HEADERS],
    ...flat.map((task) => [
      task.wbsNumber,
      task.title,
      task.description ?? '',
      task.status,
      task.priority,
      isoDay(task.startDate),
      isoDay(task.endDate),
      task.progress,
      task.isMilestone ? 'true' : 'false',
    ]),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
  XLSX.writeFile(workbook, `${baseName}.${format}`, { bookType: format });
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

export interface ImportTask {
  wbsKey: string;
  parentKey: string | null;
  input: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    startDate?: string;
    endDate?: string;
    isMilestone: boolean;
  };
  progress: number;
}

/** A translatable validation problem; the dialog renders `key` with `params`. */
export interface ImportIssue {
  key: string;
  params?: Record<string, string | number>;
}

export interface ParseResult {
  tasks: ImportTask[];
  issues: ImportIssue[];
}

const STATUS_VALUES = new Set<string>(Object.values(TaskStatus));
const PRIORITY_VALUES = new Set<string>(Object.values(TaskPriority));
const TRUE_VALUES = new Set(['true', '1', 'yes', 'y', 'tak', 'x']);

function normalizeHeader(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

/** Parses a WBS string into integer segments; trailing ".0" is treated as the parent itself. */
function parseWbs(raw: unknown): number[] | null {
  const s = String(raw ?? '').trim();
  if (!/^\d+(\.\d+)*$/.test(s)) return null;
  const segments = s.split('.').map(Number);
  while (segments.length > 1 && segments[segments.length - 1] === 0) segments.pop();
  if (segments.some((n) => n < 1)) return null;
  return segments;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Coerces Excel dates, serials and common string formats to YYYY-MM-DD, or null if unparseable. */
function parseDate(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value);
    return d ? `${d.y}-${pad(d.m)}-${pad(d.d)}` : null;
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const dmy = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (dmy) return `${dmy[3]}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}`;
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
  }
  return null;
}

function cellText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

/** Validates that each sibling group is numbered 1..N with no gaps and that parents exist. */
function validateStructure(
  entries: Array<{ key: string; segments: number[]; row: number }>,
  issues: ImportIssue[],
): void {
  const keys = new Set(entries.map((e) => e.key));
  const childrenByParent = new Map<string, number[]>();

  for (const entry of entries) {
    const parentKey = entry.segments.slice(0, -1).join('.');
    if (parentKey && !keys.has(parentKey)) {
      issues.push({ key: 'missingParent', params: { wbs: entry.key } });
    }
    const list = childrenByParent.get(parentKey) ?? [];
    list.push(entry.segments[entry.segments.length - 1] ?? 0);
    childrenByParent.set(parentKey, list);
  }

  for (const [parentKey, lastSegments] of childrenByParent) {
    const sorted = [...lastSegments].sort((a, b) => a - b);
    if (sorted.length === 0) continue;
    const missing: number[] = [];
    const max = sorted[sorted.length - 1] ?? 0;
    const present = new Set(sorted);
    for (let n = 1; n <= max; n += 1) {
      if (!present.has(n)) missing.push(n);
    }
    const label = parentKey || '—';
    if (missing.length > 0) {
      issues.push({ key: 'wbsGap', params: { parent: label, missing: missing.join(', ') } });
    }
    if (new Set(sorted).size !== sorted.length) {
      issues.push({ key: 'wbsDuplicateGroup', params: { parent: label } });
    }
  }
}

/** Parses a CSV/XLSX file buffer into ordered import tasks plus any validation issues. */
export function parseImportFile(data: ArrayBuffer): ParseResult {
  const issues: ImportIssue[] = [];
  const workbook = XLSX.read(new Uint8Array(data), { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
  if (!sheet) return { tasks: [], issues: [{ key: 'emptyFile' }] };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    blankrows: false,
  });
  if (rows.length < 2) return { tasks: [], issues: [{ key: 'emptyFile' }] };

  // Map logical columns to their position from the header row.
  const headerRow = (rows[0] ?? []).map(normalizeHeader);
  const colIndex: Record<string, number> = {};
  for (const [col, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = headerRow.findIndex((h) => aliases.includes(h));
    if (idx !== -1) colIndex[col] = idx;
  }

  if (colIndex.title === undefined) issues.push({ key: 'noTitleColumn' });
  if (colIndex.wbs === undefined) issues.push({ key: 'noWbsColumn' });
  if (issues.length > 0) return { tasks: [], issues };

  const at = (row: unknown[], col: string): unknown => {
    const idx = colIndex[col];
    return idx === undefined ? undefined : row[idx];
  };

  const tasks: ImportTask[] = [];
  const entries: Array<{ key: string; segments: number[]; row: number }> = [];
  const seenKeys = new Set<string>();

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row) continue;
    const rowNumber = i + 1; // 1-based spreadsheet row
    const title = cellText(at(row, 'title'));
    const wbsRaw = cellText(at(row, 'wbs'));
    if (!title && !wbsRaw) continue; // skip blank lines

    if (!title) {
      issues.push({ key: 'rowMissingTitle', params: { row: rowNumber } });
      continue;
    }

    const segments = parseWbs(at(row, 'wbs'));
    if (!segments) {
      issues.push({ key: 'invalidWbs', params: { row: rowNumber, value: wbsRaw } });
      continue;
    }
    const wbsKey = segments.join('.');
    if (seenKeys.has(wbsKey)) {
      issues.push({ key: 'duplicateWbs', params: { value: wbsKey } });
      continue;
    }
    seenKeys.add(wbsKey);

    const statusRaw = cellText(at(row, 'status')).toUpperCase();
    if (statusRaw && !STATUS_VALUES.has(statusRaw)) {
      issues.push({ key: 'invalidStatus', params: { row: rowNumber, value: statusRaw } });
      continue;
    }
    const priorityRaw = cellText(at(row, 'priority')).toUpperCase();
    if (priorityRaw && !PRIORITY_VALUES.has(priorityRaw)) {
      issues.push({ key: 'invalidPriority', params: { row: rowNumber, value: priorityRaw } });
      continue;
    }

    const startDate = parseDate(at(row, 'startDate'));
    const endDate = parseDate(at(row, 'endDate'));
    if (startDate === null) {
      issues.push({ key: 'invalidDate', params: { row: rowNumber, value: cellText(at(row, 'startDate')) } });
      continue;
    }
    if (endDate === null) {
      issues.push({ key: 'invalidDate', params: { row: rowNumber, value: cellText(at(row, 'endDate')) } });
      continue;
    }

    const progressRaw = at(row, 'progress');
    let progress = typeof progressRaw === 'number' ? progressRaw : Number(cellText(progressRaw));
    if (!Number.isFinite(progress)) progress = 0;
    progress = Math.min(100, Math.max(0, Math.round(progress)));

    const description = cellText(at(row, 'description'));
    const milestone = TRUE_VALUES.has(cellText(at(row, 'milestone')).toLowerCase());

    entries.push({ key: wbsKey, segments, row: rowNumber });
    tasks.push({
      wbsKey,
      parentKey: segments.length > 1 ? segments.slice(0, -1).join('.') : null,
      input: {
        title,
        description: description || undefined,
        status: (statusRaw || TaskStatus.TODO) as TaskStatus,
        priority: (priorityRaw || TaskPriority.NONE) as TaskPriority,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isMilestone: milestone,
      },
      progress,
    });
  }

  validateStructure(entries, issues);

  // Parents must be created before children — a WBS prefix always sorts first.
  tasks.sort((a, b) => {
    const sa = a.wbsKey.split('.').map(Number);
    const sb = b.wbsKey.split('.').map(Number);
    for (let i = 0; i < Math.max(sa.length, sb.length); i += 1) {
      const diff = (sa[i] ?? 0) - (sb[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });

  return { tasks, issues };
}
