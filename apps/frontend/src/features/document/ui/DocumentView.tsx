import { Fragment, useState } from 'react';
import { Clock, MessageSquare, MoreHorizontal, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocumentDetail } from '@planforge/shared';
import { useDocument } from '@/entities/document/hooks/use-documents';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';
import { DocumentEditorPane } from './DocumentEditorPane';
import { ShareDocDialog } from './ShareDocDialog';

interface DocumentViewProps {
  docId: string;
}

/** Loads a single document and renders its topbar + editor pane. */
export function DocumentView({ docId }: DocumentViewProps) {
  const { t } = useTranslation('docs');
  const { data: doc, isPending } = useDocument(docId);

  if (isPending) return <FullPageSpinner />;
  if (!doc) return null;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <DocumentTopbar doc={doc} t={t} />
      {/* Keyed by id so the editor re-initialises with the new document's body. */}
      <DocumentEditorPane key={doc.id} doc={doc} />
    </div>
  );
}

function DocumentTopbar({
  doc,
  t,
}: {
  doc: DocumentDetail;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const iconBtn =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-faint transition-colors hover:bg-muted hover:text-foreground';
  const [shareOpen, setShareOpen] = useState(false);
  const isOwner = doc.myAccess === 'OWNER';

  return (
    <div className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border px-5">
      <nav className="flex items-center gap-1.5 text-[12.5px] text-faint">
        {doc.breadcrumb.map((crumb, i) => {
          const isLast = i === doc.breadcrumb.length - 1;
          return (
            <Fragment key={crumb.id}>
              {i > 0 && <span>›</span>}
              {isLast ? (
                <span className="font-semibold text-foreground">{crumb.title}</span>
              ) : (
                <span>{crumb.title}</span>
              )}
            </Fragment>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" className={iconBtn} title={t('topbar.history')}>
          <Clock className="h-[15px] w-[15px]" />
        </button>
        <button type="button" className={iconBtn} title={t('topbar.comments')}>
          <MessageSquare className="h-[15px] w-[15px]" />
        </button>
        <button type="button" className={iconBtn} title={t('topbar.more')}>
          <MoreHorizontal className="h-[15px] w-[15px]" />
        </button>
        {isOwner && (
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent-purple px-3.5 py-[7px] text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <Share2 className="h-3.5 w-3.5" />
            {t('topbar.share')}
          </button>
        )}
      </div>

      {shareOpen && (
        <ShareDocDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          docId={doc.id}
          docTitle={doc.title}
        />
      )}
    </div>
  );
}
