import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocumentNodeType } from '@planforge/shared';
import { useDocumentTree } from '@/entities/document/hooks/use-documents';
import { filterDocumentTree } from '@/entities/document/lib/filter-tree';
import { DocsTreeNode } from './DocsTreeNode';
import { CreateDocMenu } from './CreateDocMenu';
import { useCreateDocument } from '../hooks/use-document-mutations';

interface DocsTreeSidebarProps {
  activeId: string | undefined;
}

/** The second sidebar: search + scrollable tree + bottom "Create" bar. */
export function DocsTreeSidebar({ activeId }: DocsTreeSidebarProps) {
  const { t } = useTranslation('docs');
  const navigate = useNavigate();
  const { data: tree, isPending } = useDocumentTree();
  const createDoc = useCreateDocument();

  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const createBtnRef = useRef<HTMLButtonElement>(null);

  const visible = useMemo(() => filterDocumentTree(tree ?? [], query), [tree, query]);

  const handleCreateRoot = (type: DocumentNodeType) => {
    const title = type === 'FOLDER' ? t('create.untitledFolder') : t('create.untitledDoc');
    createDoc.mutate(
      { type, title, parentId: null },
      {
        onSuccess: (created) => {
          if (created.type === 'DOC') navigate(`/docs/${created.id}`);
        },
      },
    );
  };

  return (
    <div className="flex w-[280px] shrink-0 flex-col border-r border-border bg-background">
      <div className="px-4 pb-2.5 pt-4">
        <div className="flex items-center gap-2 text-[15px] font-bold">
          <FileText className="h-[17px] w-[17px] text-accent-purple" />
          {t('title')}
        </div>
        <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-border px-2.5 py-[7px]">
          <Search className="h-3.5 w-3.5 shrink-0 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full min-w-0 bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-faint"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 pt-1">
        {!isPending && visible.length === 0 && (
          <div className="px-2 py-6 text-center">
            <p className="text-[13px] font-medium text-muted-foreground">{t('empty.title')}</p>
            <p className="mt-1 text-[12px] text-faint">{t('empty.hint')}</p>
          </div>
        )}
        {visible.map((node) => (
          <DocsTreeNode key={node.id} node={node} depth={0} activeId={activeId} />
        ))}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <button
          ref={createBtnRef}
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[9px] bg-accent-purple py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-[15px] w-[15px]" strokeWidth={2.5} />
          {t('createButton')}
        </button>
        <CreateDocMenu
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          anchorRef={createBtnRef}
          placement="top-stretch"
          onSelect={handleCreateRoot}
        />
      </div>
    </div>
  );
}
