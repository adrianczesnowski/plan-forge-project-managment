import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, FileText, Folder, MoreHorizontal, Plus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocumentNodeType } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import {
  useCreateDocument,
  useDeleteDocument,
  useUpdateDocument,
} from '../hooks/use-document-mutations';
import { INDENT_WIDTH, type FlatNode } from '../lib/tree-dnd';
import { CreateDocMenu } from './CreateDocMenu';
import { DocRowMenu } from './DocRowMenu';
import { DeleteDocDialog } from './DeleteDocDialog';
import { ShareDocDialog } from './ShareDocDialog';

interface DocsTreeRowProps {
  flat: FlatNode;
  /** Id of the document currently open in the editor (route param). */
  routeId: string | undefined;
  expanded: boolean;
  onToggle: (id: string) => void;
  onExpand: (id: string) => void;
  renameId: string | null;
  onRequestRename: (id: string | null) => void;
  /** Projected depth while this row is being dragged (overrides flat depth). */
  dragDepth: number | null;
}

/** One row of the (flattened) docs tree — sortable, with inline rename + actions. */
export function DocsTreeRow({
  flat,
  routeId,
  expanded,
  onToggle,
  onExpand,
  renameId,
  onRequestRename,
  dragDepth,
}: DocsTreeRowProps) {
  const { node, depth } = flat;
  const { t } = useTranslation('docs');
  const navigate = useNavigate();

  const isFolder = node.type === 'FOLDER';
  const hasChildren = node.children.length > 0;
  const canExpand = isFolder || hasChildren;
  const isActive = routeId === node.id;
  const isOwner = node.myAccess === 'OWNER';
  const canEdit = isOwner || node.myAccess === 'EDIT';

  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(node.title);

  const addRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const createDoc = useCreateDocument();
  const updateDoc = useUpdateDocument();
  const deleteDoc = useDeleteDocument();

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: node.id,
    // Only the owner can restructure their tree (move is owner-only on the backend).
    disabled: renaming || !isOwner,
  });

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  // Open straight into rename when this node was just created.
  useEffect(() => {
    if (renameId === node.id) {
      setDraftTitle(node.title);
      setRenaming(true);
      onRequestRename(null);
    }
  }, [renameId, node.id, node.title, onRequestRename]);

  const handleRowClick = () => {
    if (renaming) return;
    if (isFolder) onToggle(node.id);
    else navigate(`/docs/${node.id}`);
  };

  const handleCreateInside = (type: DocumentNodeType) => {
    const title = type === 'FOLDER' ? t('create.untitledFolder') : t('create.untitledDoc');
    createDoc.mutate(
      { type, title, parentId: node.id },
      {
        onSuccess: (created) => {
          onExpand(node.id);
          if (created.type === 'DOC') {
            navigate(`/docs/${created.id}`, { state: { autoFocusTitle: true } });
          } else {
            onRequestRename(created.id);
          }
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

  const effectiveDepth = dragDepth ?? depth;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10 opacity-60')}
    >
      <div
        {...attributes}
        {...listeners}
        onClick={handleRowClick}
        onKeyDown={(e) => e.key === 'Enter' && handleRowClick()}
        style={{ paddingLeft: 8 + effectiveDepth * INDENT_WIDTH }}
        className={cn(
          'group relative flex cursor-pointer items-center gap-1.5 rounded-[7px] py-[5px] pr-2 text-[13px] transition-colors',
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
            onToggle(node.id);
          }}
          className={cn(
            'flex h-3.5 w-3.5 shrink-0 items-center justify-center text-faint transition-transform',
            expanded && 'rotate-90',
            !canExpand && 'invisible',
          )}
        >
          <ChevronRight className="h-3 w-3" />
        </span>

        {node.icon ? (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[14px] leading-none">
            {node.icon}
          </span>
        ) : isFolder ? (
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

        {!isOwner && (
          <span title={t('sharedWithYou')} className="flex shrink-0 items-center">
            <Users className="h-3.5 w-3.5 text-faint" />
          </span>
        )}

        <span
          className={cn(
            'flex shrink-0 items-center gap-0.5 transition-opacity',
            createOpen || menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          {isOwner && (
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
          )}
          {canEdit && (
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
          )}
        </span>
      </div>

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
        canManage={isOwner}
        canEdit={canEdit}
        onShare={() => setShareOpen(true)}
        onRename={() => {
          setDraftTitle(node.title);
          setRenaming(true);
        }}
        onCreateInside={() => setCreateOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />
      {shareOpen && (
        <ShareDocDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          docId={node.id}
          docTitle={node.title}
        />
      )}
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
