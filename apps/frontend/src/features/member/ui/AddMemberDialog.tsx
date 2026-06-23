import { useMemo, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { IconInput } from '@/shared/ui/icon-input';
import { Avatar } from '@/shared/ui/avatar';
import { RoleSelect } from './RoleSelect';
import { translateApiError } from '@/shared/lib/api-error';
import { cn } from '@/shared/lib/utils';
import type { MemberCandidate, MemberRole } from '../model/roles';

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  candidates: MemberCandidate[];
  roleOptions: readonly MemberRole[];
  defaultRole: MemberRole;
  isAdding: boolean;
  error: unknown;
  onAdd: (userId: string, role: MemberRole) => void;
}

/** Dialog to pick an eligible user from the candidate pool and assign a role. */
export function AddMemberDialog({
  open,
  onClose,
  candidates,
  roleOptions,
  defaultRole,
  isAdding,
  error,
  onAdd,
}: AddMemberDialogProps) {
  const { t } = useTranslation('members');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [role, setRole] = useState(defaultRole);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) =>
      `${c.user.firstName} ${c.user.lastName} ${c.user.email}`.toLowerCase().includes(q),
    );
  }, [candidates, query]);

  const handleAdd = () => {
    if (!selectedId) return;
    onAdd(selectedId, role);
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('add.title')}>
      <div className="flex flex-col gap-4">
        <IconInput
          icon={Search}
          placeholder={t('add.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-faint">{t('add.noCandidates')}</p>
          ) : (
            filtered.map(({ user, blockReason }) => {
              const blocked = Boolean(blockReason);
              return (
                <button
                  key={user.id}
                  type="button"
                  disabled={blocked}
                  onClick={() => setSelectedId(user.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-border-light px-3 py-2 text-left transition-colors last:border-b-0',
                    blocked
                      ? 'cursor-not-allowed opacity-55'
                      : selectedId === user.id
                        ? 'bg-primary/5'
                        : 'hover:bg-muted/50',
                  )}
                >
                  <Avatar user={user} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="truncate text-[11.5px] text-faint">{user.email}</div>
                  </div>
                  {blockReason ? (
                    <span className="shrink-0 text-[11px] font-medium text-faint">
                      {t(`add.blocked.${blockReason}`)}
                    </span>
                  ) : selectedId === user.id ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] font-medium text-muted-foreground">{t('add.roleLabel')}</span>
          <RoleSelect value={role} options={roleOptions} onChange={setRole} />
        </div>

        {error ? <p className="text-sm text-destructive">{translateApiError(error)}</p> : null}

        <Button onClick={handleAdd} disabled={!selectedId} isLoading={isAdding}>
          <UserPlus className="h-4 w-4" />
          {t('add.submit')}
        </Button>
      </div>
    </Dialog>
  );
}
