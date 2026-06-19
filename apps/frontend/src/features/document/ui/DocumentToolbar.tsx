import type { Editor } from '@tiptap/react';
import {
  Bold,
  CheckSquare,
  Code2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface DocumentToolbarProps {
  editor: Editor;
}

/** Formatting toolbar wired to the active tiptap editor. */
export function DocumentToolbar({ editor }: DocumentToolbarProps) {
  const btn = (active: boolean) =>
    cn(
      'flex h-[30px] w-[30px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
      active && 'bg-muted text-accent-purple',
    );

  const Divider = () => <span className="mx-1.5 h-5 w-px bg-border" />;

  return (
    <div className="flex shrink-0 items-center gap-0.5 border-b border-border px-5 py-1.5">
      <button
        type="button"
        className={btn(editor.isActive('bold'))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn(editor.isActive('italic'))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn(editor.isActive('underline'))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn(editor.isActive('strike'))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </button>

      <Divider />

      <button
        type="button"
        className={btn(editor.isActive('heading', { level: 1 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        <span className="text-[13px] font-semibold">H1</span>
      </button>
      <button
        type="button"
        className={btn(editor.isActive('heading', { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <span className="text-[13px] font-semibold">H2</span>
      </button>

      <Divider />

      <button
        type="button"
        className={btn(editor.isActive('bulletList'))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn(editor.isActive('orderedList'))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn(editor.isActive('taskList'))}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Checklist"
      >
        <CheckSquare className="h-4 w-4" />
      </button>

      <Divider />

      <button
        type="button"
        className={btn(editor.isActive('blockquote'))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Callout"
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn(editor.isActive('codeBlock'))}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code block"
      >
        <Code2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn(false)}
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="Table"
      >
        <TableIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
