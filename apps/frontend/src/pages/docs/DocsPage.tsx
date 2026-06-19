import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DocsTreeSidebar } from '@/features/document/ui/DocsTreeSidebar';
import { DocumentView } from '@/features/document/ui/DocumentView';

/** Docs module: file-tree sidebar + document editor (Confluence/Notion-style). */
export function DocsPage() {
  const { docId } = useParams<{ docId?: string }>();

  return (
    <div className="flex h-full overflow-hidden">
      <DocsTreeSidebar activeId={docId} />
      {docId ? <DocumentView docId={docId} /> : <DocsEmptyState />}
    </div>
  );
}

function DocsEmptyState() {
  const { t } = useTranslation('docs');
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <FileText className="h-6 w-6 text-faint" />
      </div>
      <p className="text-[15px] font-semibold text-foreground">{t('selectPrompt.title')}</p>
      <p className="max-w-xs text-[13px] text-muted-foreground">{t('selectPrompt.hint')}</p>
    </div>
  );
}
