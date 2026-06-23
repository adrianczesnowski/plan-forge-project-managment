import type { Editor } from '@tiptap/react';
import type { EditorState } from '@tiptap/pm/state';
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Table as TableIcon,
  Type,
  type LucideIcon,
} from 'lucide-react';

export interface SlashRange {
  from: number;
  to: number;
}

export interface SlashQuery {
  /** Document range covering the "/query" text, replaced when a block is picked. */
  range: SlashRange;
  /** Text typed after the slash (may be empty right after "/"). */
  query: string;
}

export interface SlashItem {
  /** i18n key under `editor.slash.items`. */
  key: string;
  icon: LucideIcon;
  /** Extra match terms (besides the translated title) for filtering. */
  keywords: string[];
  run: (editor: Editor, range: SlashRange) => void;
}

const at = (editor: Editor, range: SlashRange) => editor.chain().focus().deleteRange(range);

/** Notion-style block menu offered by the "/" command. */
export const SLASH_ITEMS: SlashItem[] = [
  { key: 'text', icon: Type, keywords: ['paragraph', 'plain'], run: (e, r) => at(e, r).setParagraph().run() },
  { key: 'h1', icon: Heading1, keywords: ['heading', 'title', 'h1'], run: (e, r) => at(e, r).setHeading({ level: 1 }).run() },
  { key: 'h2', icon: Heading2, keywords: ['heading', 'subtitle', 'h2'], run: (e, r) => at(e, r).setHeading({ level: 2 }).run() },
  { key: 'h3', icon: Heading3, keywords: ['heading', 'h3'], run: (e, r) => at(e, r).setHeading({ level: 3 }).run() },
  { key: 'bulletList', icon: List, keywords: ['unordered', 'ul', 'bullet'], run: (e, r) => at(e, r).toggleBulletList().run() },
  { key: 'orderedList', icon: ListOrdered, keywords: ['numbered', 'ol'], run: (e, r) => at(e, r).toggleOrderedList().run() },
  { key: 'taskList', icon: ListChecks, keywords: ['todo', 'checklist', 'checkbox'], run: (e, r) => at(e, r).toggleTaskList().run() },
  { key: 'blockquote', icon: Quote, keywords: ['quote', 'callout'], run: (e, r) => at(e, r).toggleBlockquote().run() },
  { key: 'codeBlock', icon: Code2, keywords: ['code', 'snippet', 'pre'], run: (e, r) => at(e, r).toggleCodeBlock().run() },
  { key: 'divider', icon: Minus, keywords: ['hr', 'rule', 'separator', 'line'], run: (e, r) => at(e, r).setHorizontalRule().run() },
  {
    key: 'table',
    icon: TableIcon,
    keywords: ['grid'],
    run: (e, r) => at(e, r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    key: 'image',
    icon: ImageIcon,
    keywords: ['picture', 'photo', 'upload'],
    run: (e, r) => at(e, r).insertContent({ type: 'imageUpload' }).run(),
  },
];

/**
 * Detects an active slash command at the caret, mirroring Notion's trigger:
 * a "/" at the start of a text block or after whitespace, followed by a run of
 * non-space characters. Returns null when no menu should show (a collapsed
 * selection is required; code blocks are excluded).
 */
export function getSlashQuery(state: EditorState): SlashQuery | null {
  const { selection } = state;
  if (!selection.empty) return null;

  const { $from } = selection;
  if ($from.parent.type.spec.code) return null;

  const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼');
  const match = /(?:^|\s)\/([^\s/]*)$/.exec(textBefore);
  if (!match) return null;

  const query = match[1] ?? '';
  const from = $from.pos - query.length - 1; // -1 for the slash itself
  return { range: { from, to: $from.pos }, query };
}

/** Filters the block list by a query against each item's title and keywords. */
export function filterSlashItems(query: string, title: (key: string) => string): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter((item) => {
    const haystack = [title(item.key), ...item.keywords].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}
