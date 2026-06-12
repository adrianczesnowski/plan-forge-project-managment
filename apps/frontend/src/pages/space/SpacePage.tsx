import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FolderOpen, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSpace } from '@/entities/space/hooks/use-spaces';
import { useSpaceProjects } from '@/entities/project/hooks/use-projects';
import { ProjectCard } from '@/entities/project/ui/ProjectCard';
import { CreateProjectDialog } from '@/features/project/ui/CreateProjectDialog';
import { Button } from '@/shared/ui/button';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';

export function SpacePage() {
  const { t } = useTranslation('projects');
  const { spaceId } = useParams<{ spaceId: string }>();
  const { data: space, isPending: spacePending } = useSpace(spaceId);
  const { data: projects, isPending: projectsPending } = useSpaceProjects(spaceId);
  const [isCreateOpen, setCreateOpen] = useState(false);

  if (spacePending || projectsPending) return <FullPageSpinner />;
  if (!space) return null;

  const canManage = space.myRole === 'OWNER' || space.myRole === 'ADMIN';

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: space.color ?? '#9ca3af' }}
            />
            <h1 className="text-xl font-bold tracking-tight">{space.name}</h1>
          </div>
          {space.description && (
            <p className="mt-1 text-sm text-muted-foreground">{space.description}</p>
          )}
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {t('newProject')}
          </Button>
        )}
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
          <FolderOpen className="h-8 w-8 text-faint" />
          <p className="text-sm font-medium text-muted-foreground">{t('empty')}</p>
          <p className="text-[13px] text-faint">
            {canManage ? t('emptyHintAdmin') : t('emptyHintMember')}
          </p>
        </div>
      )}

      {spaceId && (
        <CreateProjectDialog
          spaceId={spaceId}
          open={isCreateOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}
