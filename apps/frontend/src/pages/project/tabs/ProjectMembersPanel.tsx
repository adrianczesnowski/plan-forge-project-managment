import { useMemo } from 'react';
import type { ProjectRole, ProjectWithRole } from '@planforge/shared';
import { useProjectMembers } from '@/entities/project/hooks/use-projects';
import { useSpaceMembers } from '@/entities/space/hooks/use-spaces';
import { useProjectMemberMutations } from '@/features/member/hooks/use-project-members';
import { MembersManager } from '@/features/member/ui/MembersManager';
import type { MemberCandidate } from '@/features/member/model/roles';
import { useAuthStore } from '@/stores/auth.store';

const ROLE_OPTIONS: readonly ProjectRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];

/** Member management body for a project (no outer padding — embedded in the settings tab). */
export function ProjectMembersPanel({ project }: { project: ProjectWithRole }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: members, isPending } = useProjectMembers(project.id);
  // Candidate pool is the project's space members: a MEMBER who isn't in the project yet is
  // addable; space OWNER/ADMIN already have implicit access and aren't shown.
  const { data: spaceMembers } = useSpaceMembers(project.spaceId);
  const { addMember, updateRole, removeMember } = useProjectMemberMutations(project.id);

  const canManage = project.myRole === 'OWNER' || project.myRole === 'ADMIN';
  const canChangeRole = project.myRole === 'OWNER';

  const candidates = useMemo<MemberCandidate[]>(() => {
    const inProject = new Set((members ?? []).map((m) => m.userId));
    return (spaceMembers ?? [])
      .filter((m) => m.role === 'MEMBER')
      .map((m) => (inProject.has(m.userId) ? { user: m.user, blockReason: 'ALREADY_MEMBER' } : { user: m.user }));
  }, [spaceMembers, members]);

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
      onAdd={(userId, role) => addMember.mutate({ userId, role: role as ProjectRole })}
      onUpdateRole={(userId, role) => updateRole.mutate({ userId, role: role as ProjectRole })}
      onRemove={(userId) => removeMember.mutate(userId)}
      addState={addMember}
      removeState={removeMember}
    />
  );
}
