import type { UserSummary } from '@planforge/shared';

/** Union of every role name used across org / space / project levels — drives typed i18n keys. */
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

/** Why a user cannot be added — shown as a muted label in the add-member list. */
export type CandidateBlockReason = 'ALREADY_MEMBER';

/** A user shown in the add-member dialog; disabled (with a reason) when not addable. */
export interface MemberCandidate {
  user: UserSummary;
  blockReason?: CandidateBlockReason;
}
