import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/features/auth/hooks/use-auth';

export function SidebarUser() {
  const { t } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  if (!user) return null;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="flex items-center gap-2.5 rounded-[7px] px-2.5 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold leading-tight">
          {user.firstName} {user.lastName}
        </div>
        <div className="truncate text-[11.5px] text-faint leading-tight">{user.email}</div>
      </div>
      <button
        type="button"
        title={t('logout')}
        onClick={() => logout.mutate()}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-muted hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
