import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { EditorContent } from '@tiptap/react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { DocumentDetail } from '@planforge/shared';
import { useAuthStore } from '@/stores/auth.store';
import { useDocumentEditor, type SaveStatus } from '../hooks/use-document-editor';
import { useUpdateDocument } from '../hooks/use-document-mutations';
import { DocumentToolbar } from './DocumentToolbar';

const DEFAULT_COVER = 'linear-gradient(120deg, #7c5cfc 0%, #a855f7 60%, #ec4899 100%)';

interface DocumentEditorPaneProps {
  doc: DocumentDetail;
}

export function DocumentEditorPane({ doc }: DocumentEditorPaneProps) {
  if (doc.type === 'FOLDER') return <FolderPane doc={doc} />;
  return <DocPane doc={doc} />;
}

/** Folders have no body — show a simple cover + title header. */
function FolderPane({ doc }: DocumentEditorPaneProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[760px] px-8 pb-24 pt-10">
        <Cover doc={doc} />
        <DocTitle doc={doc} />
      </div>
    </div>
  );
}

function DocPane({ doc }: DocumentEditorPaneProps) {
  const { t } = useTranslation('docs');
  const { editor, status } = useDocumentEditor(doc.id, doc.content);

  return (
    <>
      {editor && <DocumentToolbar editor={editor} />}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] px-8 pb-24 pt-10">
          <Cover doc={doc} />
          <DocTitle doc={doc} />
          <DocMeta doc={doc} status={status} t={t} />
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
}

function Cover({ doc }: { doc: DocumentDetail }) {
  return (
    <div
      className="relative mb-6 h-[140px] rounded-2xl"
      style={{ background: doc.coverColor ?? DEFAULT_COVER }}
    >
      <div className="absolute -bottom-[22px] left-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[44px] leading-none shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
        {doc.icon ?? (doc.type === 'FOLDER' ? '📁' : '📄')}
      </div>
    </div>
  );
}

/** Inline-editable document title. */
function DocTitle({ doc }: { doc: DocumentDetail }) {
  const { t } = useTranslation('docs');
  const updateDoc = useUpdateDocument();
  const [title, setTitle] = useState(doc.title);

  const save = (e?: FormEvent) => {
    e?.preventDefault();
    const next = title.trim();
    if (next && next !== doc.title) {
      updateDoc.mutate({ id: doc.id, input: { title: next } });
    } else if (!next) {
      setTitle(doc.title);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.currentTarget.blur();
    if (e.key === 'Escape') {
      setTitle(doc.title);
      e.currentTarget.blur();
    }
  };

  return (
    <form onSubmit={save}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => save()}
        onKeyDown={onKeyDown}
        placeholder={t('editor.titlePlaceholder')}
        className="mb-2.5 mt-7 w-full bg-transparent text-[34px] font-bold leading-tight text-foreground outline-none placeholder:text-faint"
      />
    </form>
  );
}

function DocMeta({
  doc,
  status,
  t,
}: {
  doc: DocumentDetail;
  status: SaveStatus;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const user = useAuthStore((s) => s.user);
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '··';
  const name = user ? `${user.firstName} ${user.lastName}` : '';
  const edited = formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true });

  return (
    <div className="mb-7 flex items-center gap-2.5 text-[12.5px] text-faint">
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[9px] font-bold text-white">
        {initials}
      </span>
      {name}
      <Dot />
      {t('meta.editedAgo', { time: edited })}
      {status !== 'idle' && (
        <>
          <Dot />
          <span>{status === 'saving' ? t('editor.saving') : t('editor.saved')}</span>
        </>
      )}
    </div>
  );
}

function Dot() {
  return <span className="h-[3px] w-[3px] rounded-full bg-faint" />;
}
