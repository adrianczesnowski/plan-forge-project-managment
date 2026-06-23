import { useMemo } from 'react';
import type { SpaceRole, SpaceWithRole } from '@planforge/shared';
import { useSpaceMembers } from '@/entities/space/hooks/use-spaces';
import { useCurrentOrganization } from '@/entities/organization/hooks/use-current-organization';
import { useOrganizationMembers } from '@/entities/organization/hooks/use-organization-members';
import { useSpaceMemberMutations } from '@/features/member/hooks/use-space-members';
import { MembersManager } from '@/features/member/ui/MembersManager';
import type { MemberCandidate } from '@/features/member/model/roles';
import { useAuthStore } from '@/stores/auth.store';

const ROLE_OPTIONS: readonly SpaceRole[] = ['ADMIN', 'MEMBER'];

/** Member management body for a space (no dialog wrapper — embedded in the settings dialog). */
export function SpaceMembersPanel({ space }: { space: SpaceWithRole }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: members, isPending } = useSpaceMembers(space.id);
  // Candidate pool is the organization: org MEMBERs not in the space yet are addable;
  // org OWNER/ADMIN already have implicit access and aren't shown.
  const { data: organization } = useCurrentOrganization();
  const { data: orgMembers } = useOrganizationMembers(organization?.id);
  const { addMember, updateRole, removeMember } = useSpaceMemberMutations(space.id);

  const canManage = space.myRole === 'OWNER' || space.myRole === 'ADMIN';
  const canChangeRole = space.myRole === 'OWNER';

  const candidates = useMemo<MemberCandidate[]>(() => {
    const inSpace = new Set((members ?? []).map((m) => m.userId));
    return (orgMembers ?? [])
      .filter((m) => m.role === 'MEMBER')
      .map((m) => (inSpace.has(m.userId) ? { user: m.user, blockReason: 'ALREADY_MEMBER' } : { user: m.user }));
  }, [orgMembers, members]);

  return (
    <MembersManager
      members={members ?? []}
      roleOptions={ROLE_OPTIONS}
      defaultAddRole="MEMBER"
      candidates={candidates}
      canManage={canManage}
      canChangeRole={canChangeRole}
      currentUserId={currentUserId}
      isLoading={isPending}
      onAdd={(userId, role) => addMember.mutate({ userId, role: role as SpaceRole })}
      onUpdateRole={(userId, role) => updateRole.mutate({ userId, role: role as SpaceRole })}
      onRemove={(userId) => removeMember.mutate(userId)}
      addState={addMember}
      removeState={removeMember}
    />
  );
}
