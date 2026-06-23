import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FileText, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocumentNodeType, DocumentTreeNode } from '@planforge/shared';
import { useDocumentTree } from '@/entities/document/hooks/use-documents';
import { filterDocumentTree } from '@/entities/document/lib/filter-tree';
import { flattenTree, getProjection, removeChildrenOf } from '../lib/tree-dnd';
import { DocsTreeRow } from './DocsTreeRow';
import { CreateDocMenu } from './CreateDocMenu';
import { useCreateDocument, useMoveDocument } from '../hooks/use-document-mutations';

interface DocsTreeSidebarProps {
  activeId: string | undefined;
}

/** Collects every node id in a (sub)tree — used to fully expand search results. */
function collectIds(nodes: DocumentTreeNode[]): string[] {
  return nodes.flatMap((n) => [n.id, ...collectIds(n.children)]);
}

/** The second sidebar: search + drag-and-drop tree + bottom "Create" bar. */
export function DocsTreeSidebar({ activeId }: DocsTreeSidebarProps) {
  const { t } = useTranslation('docs');
  const navigate = useNavigate();
  const { data: tree, isPending } = useDocumentTree();
  const createDoc = useCreateDocument();
  const moveDoc = useMoveDocument();

  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Id of a freshly created node that should open straight into inline rename.
  const [renameId, setRenameId] = useState<string | null>(null);
  const createBtnRef = useRef<HTMLButtonElement>(null);

  // Drag state.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Seed: open root folders the first time the tree arrives (matches prior UX).
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !tree) return;
    seeded.current = true;
    setExpanded(new Set(tree.filter((n) => n.type === 'FOLDER').map((n) => n.id)));
  }, [tree]);

  const searching = query.trim().length > 0;
  const visibleTree = useMemo(() => filterDocumentTree(tree ?? [], query), [tree, query]);
  // While searching, expand everything so matches deep in the tree are visible.
  const expandedSet = useMemo(
    () => (searching ? new Set(collectIds(visibleTree)) : expanded),
    [searching, visibleTree, expanded],
  );

  const flat = useMemo(() => flattenTree(visibleTree, expandedSet), [visibleTree, expandedSet]);
  // Hide the dragged node's descendants so it can't be dropped inside itself.
  const renderFlat = draggingId ? removeChildrenOf(flat, [draggingId]) : flat;
  const projection =
    draggingId && overId ? getProjection(renderFlat, draggingId, overId, offsetLeft) : null;

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const expand = (id: string) => setExpanded((prev) => new Set(prev).add(id));

  const handleCreateRoot = (type: DocumentNodeType) => {
    const title = type === 'FOLDER' ? t('create.untitledFolder') : t('create.untitledDoc');
    createDoc.mutate(
      { type, title, parentId: null },
      {
        onSuccess: (created) => {
          if (created.type === 'DOC') navigate(`/docs/${created.id}`, { state: { autoFocusTitle: true } });
          else setRenameId(created.id);
        },
      },
    );
  };

  const resetDrag = () => {
    setDraggingId(null);
    setOverId(null);
    setOffsetLeft(0);
  };

  const onDragStart = ({ active }: DragStartEvent) => setDraggingId(String(active.id));
  const onDragMove = ({ delta }: DragMoveEvent) => setOffsetLeft(delta.x);
  const onDragOver = ({ over }: DragOverEvent) => setOverId(over ? String(over.id) : null);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && projection) {
      const { parentId, depth } = projection;
      const activeIndex = renderFlat.findIndex((i) => i.id === active.id);
      const overIndex = renderFlat.findIndex((i) => i.id === over.id);
      const sorted = arrayMove(renderFlat, activeIndex, overIndex);
      const index = sorted.slice(0, overIndex).filter((i) => i.parentId === parentId).length;
      const current = flat.find((i) => i.id === active.id);

      if (current && (current.parentId !== parentId || current.depth !== depth)) {
        if (parentId) expand(parentId);
      }
      moveDoc.mutate({ id: String(active.id), input: { parentId, index } });
    }
    resetDrag();
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
        {!isPending && flat.length === 0 && (
          <div className="px-2 py-6 text-center">
            <p className="text-[13px] font-medium text-muted-foreground">{t('empty.title')}</p>
            <p className="mt-1 text-[12px] text-faint">{t('empty.hint')}</p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={resetDrag}
        >
          <SortableContext items={renderFlat.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {renderFlat.map((item) => (
              <DocsTreeRow
                key={item.id}
                flat={item}
                routeId={activeId}
                expanded={expandedSet.has(item.id)}
                onToggle={toggle}
                onExpand={expand}
                renameId={renameId}
                onRequestRename={setRenameId}
                dragDepth={draggingId === item.id ? (projection?.depth ?? null) : null}
              />
            ))}
          </SortableContext>
        </DndContext>
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
