import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Folder, Link2, Lock, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProjectDocNode, ProjectWithRole } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import {
  useProjectDocs,
  useUnlinkProjectDoc,
} from '@/features/document/hooks/use-project-docs';
import { LinkDocPickerDialog } from '@/features/document/ui/LinkDocPickerDialog';

const MANAGER_ROLES = ['OWNER', 'ADMIN', 'MEMBER'];

/** Project "Docs" tab: documents/folders attached to the project. */
export function ProjectDocsTab({ project }: { project: ProjectWithRole }) {
  const { t } = useTranslation('docs');
  const { data: links = [], isPending } = useProjectDocs(project.id);
  const unlink = useUnlinkProjectDoc(project.id);
  const canManage = MANAGER_ROLES.includes(project.myRole);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-bold">{t('projectDocs.title')}</h2>
        {canManage && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent-purple px-3 py-[7px] text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {t('projectDocs.linkButton')}
          </button>
        )}
      </div>

      {!isPending && links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
          <Link2 className="mx-auto mb-2 h-6 w-6 text-faint" />
          <p className="text-[13px] text-muted-foreground">{t('projectDocs.empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 rounded-xl border border-border p-1.5">
          {links.map((link) => (
            <div key={link.linkId} className="group/root">
              <DocNodeRow
                node={link.node}
                depth={0}
                canManage={canManage}
                onUnlink={() => unlink.mutate(link.linkId)}
              />
            </div>
          ))}
        </div>
      )}

      {pickerOpen && (
        <LinkDocPickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          projectId={project.id}
        />
      )}
    </div>
  );
}

function DocNodeRow({
  node,
  depth,
  canManage,
  onUnlink,
}: {
  node: ProjectDocNode;
  depth: number;
  canManage: boolean;
  onUnlink?: () => void;
}) {
  const { t } = useTranslation('docs');
  const navigate = useNavigate();
  const isFolder = node.type === 'FOLDER';
  const hasChildren = node.children.length > 0;
  const hasAccess = node.myAccess !== null;
  const [expanded, setExpanded] = useState(depth === 0);

  const open = () => {
    if (hasAccess) navigate(`/docs/${node.id}`);
  };

  return (
    <div>
      <div
        style={{ paddingLeft: 8 + depth * 16 }}
        className={cn(
          'group flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-[13px]',
          hasAccess ? 'cursor-pointer hover:bg-muted' : 'opacity-70',
        )}
        onClick={open}
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

        {!hasAccess && (
          <span title={t('projectDocs.noAccess')} className="flex shrink-0 items-center gap-1 text-faint">
            <Lock className="h-3.5 w-3.5" />
            <span className="text-[11px]">{t('projectDocs.noAccess')}</span>
          </span>
        )}

        {canManage && onUnlink && (
          <button
            type="button"
            title={t('projectDocs.unlink')}
            onClick={(e) => {
              e.stopPropagation();
              onUnlink();
            }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-faint opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {expanded &&
        node.children.map((child) => (
          <DocNodeRow key={child.id} node={child} depth={depth + 1} canManage={canManage} />
        ))}
    </div>
  );
}
