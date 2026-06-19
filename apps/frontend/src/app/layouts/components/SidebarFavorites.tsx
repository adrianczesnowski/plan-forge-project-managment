import { NavLink } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { useFavorites } from '@/entities/favorite/hooks/use-favorites';
import { FavoriteStar } from '@/features/favorite/ui/FavoriteStar';

const SPACE_DOT_FALLBACK = '#9ca3af';

/** "Favorites" section — pinned projects & spaces. Hidden when empty. */
export function SidebarFavorites() {
  const { t } = useTranslation('common');
  const { data: favorites } = useFavorites();

  if (!favorites || favorites.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5 px-4 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
        <Star className="h-3 w-3 fill-accent-orange text-accent-orange" />
        {t('favorites.title')}
      </div>

      <div className="flex flex-col gap-0.5 px-2">
        {favorites.map((fav) => (
          <NavLink
            key={fav.id}
            to={fav.entityType === 'PROJECT' ? `/projects/${fav.entityId}` : `/spaces/${fav.entityId}`}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-2 rounded-[7px] px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                isActive && 'bg-muted font-semibold text-foreground',
              )
            }
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: fav.color ?? SPACE_DOT_FALLBACK }}
            />
            <span className="min-w-0 flex-1 truncate">{fav.name}</span>
            <FavoriteStar
              entityType={fav.entityType}
              entityId={fav.entityId}
              size={13}
              className="p-0.5 opacity-0 group-hover:opacity-100"
            />
          </NavLink>
        ))}
      </div>
    </div>
  );
}
