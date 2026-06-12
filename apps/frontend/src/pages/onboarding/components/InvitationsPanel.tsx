import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PendingInvitation } from '@planforge/shared';
import { Button } from '@/shared/ui/button';
import { translateApiError } from '@/shared/lib/api-error';
import {
  useAcceptInvitation,
  useRejectInvitation,
} from '@/features/invitation/hooks/use-invitations';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #7c5cfc, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #22c55e, #3b82f6)',
  'linear-gradient(135deg, #ec4899, #7c5cfc)',
];

function InvitationCard({ invitation, index }: { invitation: PendingInvitation; index: number }) {
  const { t } = useTranslation('onboarding');
  const accept = useAcceptInvitation();
  const reject = useRejectInvitation();
  const isBusy = accept.isPending || reject.isPending;
  const error = accept.error ?? reject.error;

  return (
    <div className="rounded-xl border border-border p-3.5 px-4 transition-colors hover:border-gray-300">
      <div className="flex items-center gap-3.5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-base font-bold text-white"
          style={{ background: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length] }}
        >
          {invitation.organization.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{invitation.organization.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {t('invitations.from', { email: invitation.invitedBy.email })} ·{' '}
            <span className="font-medium text-accent-purple">{t(`roles.${invitation.role}`)}</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            disabled={isBusy}
            isLoading={accept.isPending}
            onClick={() => accept.mutate(invitation.id)}
          >
            {t('invitations.accept')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isBusy}
            isLoading={reject.isPending}
            onClick={() => reject.mutate(invitation.id)}
          >
            {t('invitations.decline')}
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{translateApiError(error)}</p>}
    </div>
  );
}

export function InvitationsPanel({ invitations }: { invitations: PendingInvitation[] }) {
  const { t } = useTranslation('onboarding');

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Inbox className="h-8 w-8 text-faint" />
        <p className="text-sm font-medium text-muted-foreground">{t('invitations.empty')}</p>
        <p className="max-w-xs text-[13px] text-faint">{t('invitations.emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {invitations.map((invitation, index) => (
        <InvitationCard key={invitation.id} invitation={invitation} index={index} />
      ))}
    </div>
  );
}
