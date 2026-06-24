import { useMemo, useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocumentAccess } from '@planforge/shared';
import { Dialog } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { IconInput } from '@/shared/ui/icon-input';
import { Avatar } from '@/shared/ui/avatar';
import { useCurrentOrganization } from '@/entities/organization/hooks/use-current-organization';
import { useOrganizationMembers } from '@/entities/organization/hooks/use-organization-members';
import { translateApiError } from '@/shared/lib/api-error';
import { cn } from '@/shared/lib/utils';
import {
  useDocumentPermissions,
  useRemoveDocumentPermission,
  useSetDocumentPermission,
} from '../hooks/use-document-permissions';

interface ShareDocDialogProps {
  open: boolean;
  onClose: () => void;
  docId: string;
  docTitle: string;
}

const ACCESS_LEVELS: DocumentAccess[] = ['VIEW', 'COMMENT', 'EDIT'];

/** Owner-only dialog to grant/revoke per-user access (VIEW/COMMENT/EDIT) to a doc or folder. */
export function ShareDocDialog({ open, onClose, docId, docTitle }: ShareDocDialogProps) {
  const { t } = useTranslation('docs');
  const { data: org } = useCurrentOrganization();
  const { data: members = [] } = useOrganizationMembers(org?.id);
  const { data: permissions = [] } = useDocumentPermissions(docId);
  const setPermission = useSetDocumentPermission(docId);
  const removePermission = useRemoveDocumentPermission(docId);

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingAccess, setPendingAccess] = useState<DocumentAccess>('EDIT');

  const grantedIds = useMemo(() => new Set(permissions.map((p) => p.user.id)), [permissions]);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => !grantedIds.has(m.user.id))
      .filter((m) =>
        !q ? true : `${m.user.firstName} ${m.user.lastName} ${m.user.email}`.toLowerCase().includes(q),
      );
  }, [members, grantedIds, query]);

  const error = setPermission.error ?? removePermission.error;

  const handleAdd = () => {
    if (!selectedId) return;
    setPermission.mutate(
      { userId: selectedId, access: pendingAccess },
      { onSuccess: () => setSelectedId(null) },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('share.title', { title: docTitle })}>
      <div className="flex flex-col gap-5">
        {/* People who already have access */}
        <section className="flex flex-col gap-2">
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-faint">
            {t('share.peopleWithAccess')}
          </h3>
          <div className="flex flex-col divide-y divide-border-light rounded-xl border border-border">
            {permissions.length === 0 ? (
              <p className="px-3 py-4 text-center text-[13px] text-faint">{t('share.onlyYou')}</p>
            ) : (
              permissions.map((perm) => (
                <div key={perm.user.id} className="flex items-center gap-3 px-3 py-2">
                  <Avatar user={perm.user} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">
                      {perm.user.firstName} {perm.user.lastName}
                    </div>
                    <div className="truncate text-[11.5px] text-faint">{perm.user.email}</div>
                  </div>
                  <AccessSelect
                    value={perm.access}
                    onChange={(access) => setPermission.mutate({ userId: perm.user.id, access })}
                  />
                  <button
                    type="button"
                    title={t('share.remove')}
                    onClick={() => removePermission.mutate(perm.user.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-faint transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Add people */}
        <section className="flex flex-col gap-2">
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-faint">
            {t('share.addPeople')}
          </h3>
          <IconInput
            icon={Search}
            placeholder={t('share.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="max-h-52 overflow-y-auto rounded-xl border border-border">
            {candidates.length === 0 ? (
              <p className="px-3 py-5 text-center text-[13px] text-faint">{t('share.noCandidates')}</p>
            ) : (
              candidates.map(({ user }) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedId(user.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-border-light px-3 py-2 text-left transition-colors last:border-b-0',
                    selectedId === user.id ? 'bg-primary/5' : 'hover:bg-muted/50',
                  )}
                >
                  <Avatar user={user} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="truncate text-[11.5px] text-faint">{user.email}</div>
                  </div>
                  {selectedId === user.id && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <AccessSelect value={pendingAccess} onChange={setPendingAccess} />
            <Button
              className="flex-1"
              onClick={handleAdd}
              disabled={!selectedId}
              isLoading={setPermission.isPending}
            >
              <UserPlus className="h-4 w-4" />
              {t('share.add')}
            </Button>
          </div>
        </section>

        {error ? <p className="text-sm text-destructive">{translateApiError(error)}</p> : null}
      </div>
    </Dialog>
  );
}

function AccessSelect({
  value,
  onChange,
}: {
  value: DocumentAccess;
  onChange: (access: DocumentAccess) => void;
}) {
  const { t } = useTranslation('docs');
  const tr = t as unknown as (key: string) => string;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DocumentAccess)}
      className="shrink-0 cursor-pointer rounded-md border border-border bg-white px-2 py-1 text-[12px] text-foreground outline-none focus:border-accent-purple"
    >
      {ACCESS_LEVELS.map((level) => (
        <option key={level} value={level}>
          {tr(`share.access.${level}`)}
        </option>
      ))}
    </select>
  );
}
