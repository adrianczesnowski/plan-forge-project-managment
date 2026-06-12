import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowRight, Mail, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/shared/ui/logo';
import { Button } from '@/shared/ui/button';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';
import { cn } from '@/shared/lib/utils';
import { translateApiError } from '@/shared/lib/api-error';
import { useCurrentOrganization } from '@/entities/organization/hooks/use-current-organization';
import { usePendingInvitations } from '@/features/invitation/hooks/use-invitations';
import { useCreateOrganization } from '@/features/organization/hooks/use-create-organization';
import { OnboardingStepper } from './components/OnboardingStepper';
import { InvitationsPanel } from './components/InvitationsPanel';
import { CreateOrganizationPanel } from './components/CreateOrganizationPanel';
import type { InviteRowValue } from './components/InviteRow';

type Tab = 'invitations' | 'create';

export function OnboardingPage() {
  const { t } = useTranslation('onboarding');
  const currentOrg = useCurrentOrganization();
  const pendingInvitations = usePendingInvitations();
  const createOrganization = useCreateOrganization();

  const invitations = pendingInvitations.data ?? [];
  const [tab, setTab] = useState<Tab | null>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [invites, setInvites] = useState<InviteRowValue[]>([{ email: '', role: 'MEMBER' }]);

  if (currentOrg.isPending || pendingInvitations.isPending) return <FullPageSpinner />;
  if (currentOrg.data) return <Navigate to="/" replace />;

  // Default tab: invitations when there are any, otherwise the create form.
  const activeTab: Tab = tab ?? (invitations.length > 0 ? 'invitations' : 'create');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameError(t('create.nameRequired'));
      return;
    }
    setNameError(undefined);
    createOrganization.mutate({
      name: trimmed,
      invitations: invites
        .map((i) => ({ email: i.email.trim(), role: i.role }))
        .filter((i) => i.email.length > 0),
    });
  };

  const tabClass = (isActive: boolean) =>
    cn(
      'flex flex-1 items-center justify-center gap-2 border-b-2 p-4 text-[13.5px] font-medium text-muted-foreground transition-colors',
      isActive ? 'border-primary font-semibold text-foreground' : 'border-transparent hover:text-foreground',
    );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-6">
      <Logo className="mb-3 animate-fade-in-up" />
      <p className="mb-8 animate-fade-in-up text-sm text-muted-foreground [animation-delay:0.05s]">
        {t('subtitle')}
      </p>

      <OnboardingStepper />

      <div className="w-full max-w-[560px] animate-fade-in-up overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] [animation-delay:0.15s]">
        <div className="flex border-b border-border">
          <button type="button" className={tabClass(activeTab === 'invitations')} onClick={() => setTab('invitations')}>
            <Mail className="h-[17px] w-[17px]" />
            {t('tabs.invitations')}
            {invitations.length > 0 && (
              <span className="min-w-5 rounded-[10px] bg-primary px-1.5 py-px text-center text-[11px] font-bold text-white">
                {invitations.length}
              </span>
            )}
          </button>
          <button type="button" className={tabClass(activeTab === 'create')} onClick={() => setTab('create')}>
            <Plus className="h-[17px] w-[17px]" />
            {t('tabs.create')}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'invitations' ? (
            <InvitationsPanel invitations={invitations} />
          ) : (
            <CreateOrganizationPanel
              name={name}
              onNameChange={setName}
              nameError={nameError}
              invites={invites}
              onInvitesChange={setInvites}
            />
          )}
          {createOrganization.isError && activeTab === 'create' && (
            <p className="mt-3 text-sm text-destructive">
              {translateApiError(createOrganization.error)}
            </p>
          )}
        </div>

        {activeTab === 'create' && (
          <div className="flex items-center justify-end border-t border-border bg-muted/40 px-6 py-4">
            <Button onClick={handleCreate} isLoading={createOrganization.isPending}>
              {t('footer.continue')}
              {!createOrganization.isPending && <ArrowRight className="h-4 w-4" strokeWidth={2.5} />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
