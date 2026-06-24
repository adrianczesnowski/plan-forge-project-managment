import { useState } from 'react';
import { ChevronRight, FileText, Folder, Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocumentTreeNode } from '@planforge/shared';
import { Dialog } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useDocumentTree } from '@/entities/document/hooks/use-documents';
import { translateApiError } from '@/shared/lib/api-error';
import { cn } from '@/shared/lib/utils';
import { useLinkProjectDoc } from '../hooks/use-project-docs';

interface LinkDocPickerDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

/** Picks a document/folder from the user's own docs tree to attach to a project. */
export function LinkDocPickerDialog({ open, onClose, projectId }: LinkDocPickerDialogProps) {
  const { t } = useTranslation('docs');
  const { data: tree = [] } = useDocumentTree();
  const link = useLinkProjectDoc(projectId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleLink = () => {
    if (!selectedId) return;
    link.mutate({ nodeId: selectedId }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('projectDocs.picker.title')}>
      <div className="flex flex-col gap-4">
        <p className="text-[12.5px] text-faint">{t('projectDocs.picker.hint')}</p>

        <div className="max-h-72 overflow-y-auto rounded-xl border border-border p-1.5">
          {tree.length === 0 ? (
            <p className="px-2 py-6 text-center text-[13px] text-faint">
              {t('projectDocs.picker.empty')}
            </p>
          ) : (
            tree.map((node) => (
              <PickerRow
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ))
          )}
        </div>

        {link.error ? (
          <p className="text-sm text-destructive">{translateApiError(link.error)}</p>
        ) : null}

        <Button onClick={handleLink} disabled={!selectedId} isLoading={link.isPending}>
          <Link2 className="h-4 w-4" />
          {t('projectDocs.picker.confirm')}
        </Button>
      </div>
    </Dialog>
  );
}

function PickerRow({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: DocumentTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const isFolder = node.type === 'FOLDER';
  const hasChildren = node.children.length > 0;
  const [expanded, setExpanded] = useState(depth === 0 && isFolder);

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        style={{ paddingLeft: 8 + depth * 16 }}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-[13px] transition-colors',
          selectedId === node.id ? 'bg-[#f0ecff] text-accent-purple' : 'hover:bg-muted',
        )}
      >
        <span
          onClick={(e) => {
            if (!hasChildren) return;
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className={cn(
            'flex h-3.5 w-3.5 shrink-0 items-center justify-center text-faint transition-transform',
            expanded && 'rotate-90',
            !hasChildren && 'invisible',
          )}
        >
          <ChevronRight className="h-3 w-3" />
        </span>
        {node.icon ? (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[13px] leading-none">
            {node.icon}
          </span>
        ) : isFolder ? (
          <Folder className="h-4 w-4 shrink-0 fill-accent-orange text-accent-orange" />
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-faint" />
        )}
        <span className="min-w-0 flex-1 truncate">{node.title}</span>
      </button>

      {expanded &&
        node.children.map((child) => (
          <PickerRow
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}
