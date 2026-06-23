import { useEffect, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import type { Content } from '@tiptap/react';
import { useTranslation } from 'react-i18next';
import type { DocumentContent } from '@planforge/shared';
import { buildEditorExtensions } from '../lib/editor-extensions';
import { useUpdateDocument } from './use-document-mutations';

export type SaveStatus = 'idle' | 'saving' | 'saved';

const AUTOSAVE_DELAY = 800;

/**
 * Creates a tiptap editor for a document and persists its content with a
 * debounced autosave. Intended to be mounted per-document (keyed by id), so the
 * initial content is read once on mount.
 */
export function useDocumentEditor(docId: string, initialContent: DocumentContent | null) {
  const { t } = useTranslation('docs');
  const updateDoc = useUpdateDocument();
  const [status, setStatus] = useState<SaveStatus>('idle');

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const updateRef = useRef(updateDoc.mutate);
  updateRef.current = updateDoc.mutate;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildEditorExtensions(t('editor.bodyPlaceholder')),
    content: (initialContent as Content) ?? '',
    editorProps: { attributes: { class: 'simple-editor tiptap min-h-[40vh]' } },
    onUpdate: ({ editor: e }) => {
      setStatus('saving');
      clearTimeout(timer.current);
      const json = e.getJSON() as DocumentContent;
      timer.current = setTimeout(() => {
        updateRef.current(
          { id: docId, input: { content: json } },
          { onSuccess: () => setStatus('saved') },
        );
      }, AUTOSAVE_DELAY);
    },
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  return { editor, status };
}
