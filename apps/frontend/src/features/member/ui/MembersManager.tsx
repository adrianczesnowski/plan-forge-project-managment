import { useEffect, useState } from 'react';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserSummary } from '@planforge/shared';
import { Button } from '@/shared/ui/button';
import { Avatar } from '@/shared/ui/avatar';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { RoleBadge } from './RoleBadge';
import { RoleSelect } from './RoleSelect';
import { AddMemberDialog } from './AddMemberDialog';
import type { MemberCandidate, MemberRole } from '../model/roles';

export interface ManagedMember {
  id: string;
  userId: string;
  role: MemberRole;
  user: UserSummary;
}

interface MembersManagerProps {
  members: ManagedMember[];
  /** Roles that can be assigned through the UI (OWNER is intentionally excluded). */
  roleOptions: readonly MemberRole[];
  defaultAddRole: MemberRole;
  /** Users shown in the add dialog (blocked ones rendered disabled with a reason). */
  candidates: MemberCandidate[];
  /** Can the current user add/remove members (OWNER or ADMIN)? */
  canManage: boolean;
  /** Can the current user change roles (OWNER only)? */
  canChangeRole: boolean;
  /** Whether the "Add member" action is available (defaults to canManage; off for org level). */
  canAdd?: boolean;
  currentUserId: string | undefined;
  isLoading?: boolean;
  onAdd: (userId: string, role: MemberRole) => void;
  onUpdateRole: (userId: string, role: MemberRole) => void;
  onRemove: (userId: string) => void;
  addState: { isPending: boolean; error: unknown; isSuccess: boolean; reset: () => void };
  removeState: { isPending: boolean };
}

/** Presentational member list + add/role/remove controls, shared across all levels. */
export function MembersManager({
  members,
  roleOptions,
  defaultAddRole,
  candidates,
  canManage,
  canChangeRole,
  canAdd,
  currentUserId,
  isLoading,
  onAdd,
  onUpdateRole,
  onRemove,
  addState,
  removeState,
}: MembersManagerProps) {
  const { t } = useTranslation('members');
  const [addOpen, setAddOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<ManagedMember | null>(null);
  const showAdd = canAdd ?? canManage;

  // Close the dialog once an add succeeds.
  useEffect(() => {
    if (addOpen && addState.isSuccess) {
      setAddOpen(false);
      addState.reset();
    }
  }, [addOpen, addState]);

  const confirmRemove = () => {
    if (!pendingRemoval) return;
    onRemove(pendingRemoval.userId);
    setPendingRemoval(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.05em] text-faint">
          <Users className="h-3.5 w-3.5" />
          {t('title', { count: members.length })}
        </h2>
        {showAdd && (
          <Button
            size="sm"
            onClick={() => {
              addState.reset();
              setAddOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.5} />
            {t('add.button')}
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-[13px] text-faint">{t('loading')}</p>
        ) : members.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-faint">{t('empty')}</p>
        ) : (
          members.map((member) => {
            const isOwner = member.role === 'OWNER';
            const isSelf = member.userId === currentUserId;
            const showRoleSelect = canChangeRole && !isOwner;
            const showRemove = canManage && !isOwner && !isSelf;

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 border-b border-border-light px-4 py-3 last:border-b-0"
              >
                <Avatar user={member.user} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium">
                    {member.user.firstName} {member.user.lastName}
                    {isSelf && <span className="ml-1.5 text-[11.5px] text-faint">{t('you')}</span>}
                  </div>
                  <div className="truncate text-[12px] text-faint">{member.user.email}</div>
                </div>

                {showRoleSelect ? (
                  <RoleSelect
                    value={member.role}
                    options={roleOptions}
                    onChange={(role) => onUpdateRole(member.userId, role)}
                  />
                ) : (
                  <RoleBadge role={member.role} />
                )}

                {showRemove ? (
                  <button
                    type="button"
                    title={t('remove')}
                    onClick={() => setPendingRemoval(member)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-faint transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="w-7" />
                )}
              </div>
            );
          })
        )}
      </div>

      <AddMemberDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        candidates={candidates}
        roleOptions={roleOptions}
        defaultRole={defaultAddRole}
        isAdding={addState.isPending}
        error={addState.error}
        onAdd={onAdd}
      />

      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        title={t('removeConfirm.title')}
        message={t('removeConfirm.message', {
          name: pendingRemoval
            ? `${pendingRemoval.user.firstName} ${pendingRemoval.user.lastName}`
            : '',
        })}
        confirmLabel={t('remove')}
        destructive
        isLoading={removeState.isPending}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
