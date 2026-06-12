import { useParams } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSpace } from '@/entities/space/hooks/use-spaces';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';

export function SpacePage() {
  const { t } = useTranslation('spaces');
  const { spaceId } = useParams<{ spaceId: string }>();
  const { data: space, isPending } = useSpace(spaceId);

  if (isPending) return <FullPageSpinner />;
  if (!space) return null;

  return (
    <div className="p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <span className="h-3 w-3 rounded-full" style={{ background: space.color ?? '#9ca3af' }} />
        <h1 className="text-xl font-bold tracking-tight">{space.name}</h1>
      </div>
      {space.description && (
        <p className="mb-6 text-sm text-muted-foreground">{space.description}</p>
      )}

      <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
        <FolderOpen className="h-8 w-8 text-faint" />
        <p className="text-sm font-medium text-muted-foreground">{t('page.projectsSoon')}</p>
        <p className="text-[13px] text-faint">{t('page.projectsSoonHint')}</p>
      </div>
    </div>
  );
}
