import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import type { Extensions } from '@tiptap/react';

/** Shared tiptap extension set for the docs editor. */
export function buildEditorExtensions(placeholder: string): Extensions {
  return [
    StarterKit,
    Placeholder.configure({ placeholder }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
  ];
}
