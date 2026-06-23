import type { UserSummary } from '@planforge/shared';
import { cn } from '@/shared/lib/utils';

const AVATAR_COLORS = ['#7c5cfc', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6'];

function avatarColor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

interface AvatarProps {
  user: Pick<UserSummary, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  size?: number;
  className?: string;
}

/** Round user avatar — photo when available, otherwise coloured initials. */
export function Avatar({ user, size = 32, className }: AvatarProps) {
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={`${user.firstName} ${user.lastName}`}
        width={size}
        height={size}
        className={cn('shrink-0 rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36, background: avatarColor(user.id) }}
    >
      {initials}
    </span>
  );
}
