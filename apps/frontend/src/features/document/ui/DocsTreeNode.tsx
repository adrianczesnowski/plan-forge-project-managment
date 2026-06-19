import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Folder, MoreHorizontal, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocumentNodeType, DocumentTreeNode } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import {
  useCreateDocument,
  useDeleteDocument,
  useUpdateDocument,
} from '../hooks/use-document-mutations';
import { CreateDocMenu } from './CreateDocMenu';
import { DocRowMenu } from './DocRowMenu';
import { DeleteDocDialog } from './DeleteDocDialog';

interface DocsTreeNodeProps {
  node: DocumentTreeNode;
  depth: number;
  activeId: string | undefined;
}

/** One row of the docs tree, rendering its children recursively. */
export function DocsTreeNode({ node, depth, activeId }: DocsTreeNodeProps) {
  const { t } = useTranslation('docs');
  const navigate = useNavigate();

  const isFolder = node.type === 'FOLDER';
  const hasChildren = node.children.length > 0;
  const canExpand = isFolder || hasChildren;
  const isActive = activeId === node.id;

  const [expanded, setExpanded] = useState(depth === 0 && isFolder);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(node.title);

  const addRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const createDoc = useCreateDocument();
  const updateDoc = useUpdateDocument();
  const deleteDoc = useDeleteDocument();

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  const handleRowClick = () => {
    if (renaming) return;
    if (isFolder) setExpanded((e) => !e);
    else navigate(`/docs/${node.id}`);
  };

  const handleCreateInside = (type: DocumentNodeType) => {
    const title =
      type === 'FOLDER' ? t('create.untitledFolder') : t('create.untitledDoc');
    createDoc.mutate(
      { type, title, parentId: node.id },
      {
        onSuccess: (created) => {
          setExpanded(true);
          if (created.type === 'DOC') navigate(`/docs/${created.id}`);
        },
      },
    );
  };

  const submitRename = (e?: FormEvent) => {
    e?.preventDefault();
    const next = draftTitle.trim();
    setRenaming(false);
    if (next && next !== node.title) {
      updateDoc.mutate({ id: node.id, input: { title: next } });
    } else {
      setDraftTitle(node.title);
    }
  };

  const onRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setDraftTitle(node.title);
      setRenaming(false);
    }
  };

  const confirmDelete = () => {
    deleteDoc.mutate(node.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        if (isActive) navigate('/docs');
      },
    });
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(e) => e.key === 'Enter' && handleRowClick()}
        className={cn(
          'group relative flex cursor-pointer items-center gap-1.5 rounded-[7px] px-2 py-[5px] text-[13px] transition-colors',
          isActive
            ? 'bg-[#f0ecff] font-semibold text-accent-purple'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          depth === 0 && isFolder && !isActive && 'font-semibold text-foreground',
        )}
      >
        <span
          onClick={(e) => {
            if (!canExpand) return;
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className={cn(
            'flex h-3.5 w-3.5 shrink-0 items-center justify-center text-faint transition-transform',
            expanded && 'rotate-90',
            !canExpand && 'invisible',
          )}
        >
          <ChevronRight className="h-3 w-3" />
        </span>

        {isFolder ? (
          <Folder className="h-4 w-4 shrink-0 fill-accent-orange text-accent-orange" />
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-faint" />
        )}

        {renaming ? (
          <form onSubmit={submitRename} className="min-w-0 flex-1">
            <input
              ref={inputRef}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={() => submitRename()}
              onKeyDown={onRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded border border-accent-purple bg-white px-1 py-0.5 text-[13px] text-foreground outline-none"
            />
          </form>
        ) : (
          <span className="min-w-0 flex-1 truncate">{node.title}</span>
        )}

        <span
          className={cn(
            'flex shrink-0 items-center gap-0.5 transition-opacity',
            createOpen || menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          <button
            ref={addRef}
            type="button"
            title={t('createInside')}
            onClick={(e) => {
              e.stopPropagation();
              setCreateOpen(true);
            }}
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-md text-faint hover:bg-[#e0d8ff] hover:text-accent-purple',
              createOpen && 'bg-[#e0d8ff] text-accent-purple',
            )}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            ref={menuRef}
            type="button"
            title={t('rowMenu')}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(true);
            }}
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-md text-faint hover:bg-[#e0d8ff] hover:text-accent-purple',
              menuOpen && 'bg-[#e0d8ff] text-accent-purple',
            )}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      {expanded && hasChildren && (
        <div className="ml-3.5 border-l border-border-light pl-1">
          {node.children.map((child) => (
            <DocsTreeNode key={child.id} node={child} depth={depth + 1} activeId={activeId} />
          ))}
        </div>
      )}

      <CreateDocMenu
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        anchorRef={addRef}
        placement="right-start"
        onSelect={handleCreateInside}
      />
      <DocRowMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRef={menuRef}
        nodeType={node.type}
        onRename={() => {
          setDraftTitle(node.title);
          setRenaming(true);
        }}
        onCreateInside={() => setCreateOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />
      <DeleteDocDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={node.title}
        nodeType={node.type}
        isPending={deleteDoc.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
