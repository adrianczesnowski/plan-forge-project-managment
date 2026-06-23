import { useEffect, useLayoutEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import {
  filterSlashItems,
  getSlashQuery,
  type SlashItem,
  type SlashRange,
} from '../lib/slash-command';

interface SlashMenuProps {
  editor: Editor;
}

/**
 * Notion-style "/" command menu. Watches the editor for an active slash query,
 * renders a filtered block list anchored at the caret, and runs the chosen
 * block command. Keyboard navigation is captured before ProseMirror so arrows
 * and Enter drive the menu instead of the document.
 */
export function SlashMenu({ editor }: SlashMenuProps) {
  const { t } = useTranslation('docs');
  // Slash item/description keys are built dynamically, so bypass the type-safe
  // key checking for these two namespaces.
  const tr = t as unknown as (key: string) => string;
  const title = (key: string) => tr(`editor.slash.items.${key}`);
  const describe = (key: string) => tr(`editor.slash.descriptions.${key}`);

  // Re-render on every editor transaction (typing + selection moves).
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    editor.on('transaction', bump);
    return () => {
      editor.off('transaction', bump);
    };
  }, [editor]);

  const slash = getSlashQuery(editor.state);
  const items = slash ? filterSlashItems(slash.query, title) : [];

  // Escape dismisses the menu while keeping the typed "/" as literal text. We
  // remember the trigger position so the menu stays closed until the user
  // starts a fresh slash elsewhere.
  const dismissedFrom = useRef<number | null>(null);
  useEffect(() => {
    if (!slash) dismissedFrom.current = null;
  }, [slash?.range.from]);

  const open = !!slash && items.length > 0 && dismissedFrom.current !== slash.range.from;

  const [selected, setSelected] = useState(0);
  // Keep the highlighted index in range as the query narrows the list.
  useEffect(() => {
    setSelected((i) => (i >= items.length ? 0 : i));
  }, [items.length, slash?.query]);

  // Refs so the keydown handler always sees the latest state.
  const stateRef = useRef<{ open: boolean; items: SlashItem[]; selected: number; range?: SlashRange }>({
    open,
    items,
    selected,
    range: slash?.range,
  });
  stateRef.current = { open, items, selected, range: slash?.range };

  const choose = (item: SlashItem, range: SlashRange) => {
    item.run(editor, range);
  };

  useEffect(() => {
    const dom = editor.view.dom;
    const onKeyDown = (event: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s.open || !s.range) return;

      if (event.key === 'ArrowDown') {
        setSelected((i) => (i + 1) % s.items.length);
      } else if (event.key === 'ArrowUp') {
        setSelected((i) => (i - 1 + s.items.length) % s.items.length);
      } else if (event.key === 'Enter') {
        const item = s.items[s.selected];
        if (item) choose(item, s.range);
      } else if (event.key === 'Escape') {
        // Keep the "/" as text, just hide the menu.
        dismissedFrom.current = s.range.from;
        bump();
      } else {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    dom.addEventListener('keydown', onKeyDown, true);
    return () => dom.removeEventListener('keydown', onKeyDown, true);
    // editor is stable for the lifetime of this component.
  }, [editor]);

  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' });
  useLayoutEffect(() => {
    if (!open || !slash) return;
    const coords = editor.view.coordsAtPos(slash.range.from);
    const margin = 4;
    setStyle({
      position: 'fixed',
      top: coords.bottom + margin,
      left: coords.left,
      visibility: 'visible',
    });
  }, [open, slash?.range.from, items.length, editor]);

  if (!open || !slash) return null;

  return createPortal(
    <div
      style={style}
      className="z-[70] max-h-[320px] w-[260px] overflow-y-auto rounded-xl border border-border bg-white p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const active = index === selected;
        return (
          <button
            key={item.key}
            type="button"
            // Prevent the editor from losing the selection before the command runs.
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setSelected(index)}
            onClick={() => choose(item, slash.range)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors',
              active ? 'bg-[#f0ecff] text-accent-purple' : 'text-foreground hover:bg-muted',
            )}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                active ? 'border-accent-purple/30 bg-white text-accent-purple' : 'border-border bg-muted text-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-medium leading-tight">{title(item.key)}</span>
              <span className="truncate text-[11px] text-faint">{describe(item.key)}</span>
            </span>
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
