import type { OrganizationRole, UpdateOrganizationMemberInput } from '@planforge/shared';
import { useCurrentOrganization } from '@/entities/organization/hooks/use-current-organization';
import { useOrganizationMembers } from '@/entities/organization/hooks/use-organization-members';
import { useOrganizationMemberMutations } from '@/features/member/hooks/use-organization-members';
import { MembersManager } from '@/features/member/ui/MembersManager';
import { useAuthStore } from '@/stores/auth.store';

const ROLE_OPTIONS: readonly OrganizationRole[] = ['ADMIN', 'MEMBER'];

/**
 * Organization-level member management. New members join via invitations, so there is no
 * "add" action here — only role changes and removal (which cascades to spaces and projects).
 */
export function OrganizationMembersSection() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: organization } = useCurrentOrganization();
  const { data: members, isPending } = useOrganizationMembers(organization?.id);
  const { updateRole, removeMember } = useOrganizationMemberMutations(organization?.id ?? '');

  const canManage = organization?.myRole === 'OWNER' || organization?.myRole === 'ADMIN';

  return (
    <MembersManager
      members={members ?? []}
      roleOptions={ROLE_OPTIONS}
      defaultAddRole="MEMBER"
      candidates={[]}
      canManage={Boolean(canManage)}
      canChangeRole={Boolean(canManage)}
      canAdd={false}
      currentUserId={currentUserId}
      isLoading={isPending}
      onAdd={() => undefined}
      onUpdateRole={(userId, role) =>
        updateRole.mutate({ userId, role: role as UpdateOrganizationMemberInput['role'] })
      }
      onRemove={(userId) => removeMember.mutate(userId)}
      addState={{ isPending: false, error: null, isSuccess: false, reset: () => undefined }}
      removeState={removeMember}
    />
  );
}
