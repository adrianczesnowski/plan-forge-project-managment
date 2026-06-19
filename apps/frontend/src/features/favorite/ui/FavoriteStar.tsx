import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FavoriteEntityType } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';
import { useFavorites, useToggleFavorite } from '@/entities/favorite/hooks/use-favorites';

interface FavoriteStarProps {
  entityType: FavoriteEntityType;
  entityId: string;
  size?: number;
  className?: string;
}

/** Toggleable star — fills when the entity is one of the user's favorites. */
export function FavoriteStar({ entityType, entityId, size = 16, className }: FavoriteStarProps) {
  const { t } = useTranslation('common');
  const { data: favorites } = useFavorites();
  const { add, remove, isPending } = useToggleFavorite();

  const isFav = favorites?.some((f) => f.entityType === entityType && f.entityId === entityId) ?? false;

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;
    if (isFav) remove.mutate({ entityType, entityId });
    else add.mutate({ entityType, entityId });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      title={isFav ? t('favorites.remove') : t('favorites.add')}
      className={cn(
        'flex shrink-0 items-center justify-center rounded transition-colors hover:bg-muted',
        className,
      )}
    >
      <Star
        style={{ width: size, height: size }}
        className={cn(isFav ? 'fill-accent-orange text-accent-orange' : 'text-faint hover:text-foreground')}
      />
    </button>
  );
}
