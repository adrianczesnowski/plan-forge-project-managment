import { StarterKit } from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { Typography } from '@tiptap/extension-typography';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Image } from '@tiptap/extension-image';
import { Selection } from '@tiptap/extensions';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import type { Extensions } from '@tiptap/react';
import { HorizontalRule } from '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension';
import { ImageUploadNode } from '@/components/tiptap-node/image-upload-node/image-upload-node-extension';
import { handleImageUpload, MAX_FILE_SIZE } from '@/lib/tiptap-utils';
import { CodeBlock } from './code-block';

/**
 * Shared tiptap extension set for the docs editor — the Tiptap "Simple Editor"
 * template stack (rich marks, alignment, highlight, image upload) plus tables,
 * so the "/" slash menu can offer the full Notion-style block list.
 */
export function buildEditorExtensions(placeholder: string): Extensions {
  return [
    StarterKit.configure({
      horizontalRule: false,
      codeBlock: false,
      link: { openOnClick: false, enableClickSelection: true },
    }),
    CodeBlock,
    HorizontalRule,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Image,
    Typography,
    Superscript,
    Subscript,
    Selection,
    ImageUploadNode.configure({
      accept: 'image/*',
      maxSize: MAX_FILE_SIZE,
      limit: 3,
      upload: handleImageUpload,
      onError: (error) => console.error('Upload failed:', error),
    }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({ placeholder }),
  ];
}
