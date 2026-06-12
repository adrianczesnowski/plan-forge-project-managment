import { Box, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconInput } from '@/shared/ui/icon-input';
import { FormField } from '@/shared/ui/form-field';
import type { InviteRowValue } from './InviteRow';
import { InviteRow } from './InviteRow';

interface CreateOrganizationPanelProps {
  name: string;
  onNameChange: (name: string) => void;
  nameError?: string;
  invites: InviteRowValue[];
  onInvitesChange: (invites: InviteRowValue[]) => void;
}

export function CreateOrganizationPanel({
  name,
  onNameChange,
  nameError,
  invites,
  onInvitesChange,
}: CreateOrganizationPanelProps) {
  const { t } = useTranslation('onboarding');

  const updateInvite = (index: number) => (value: InviteRowValue) =>
    onInvitesChange(invites.map((invite, i) => (i === index ? value : invite)));

  const removeInvite = (index: number) => () =>
    onInvitesChange(invites.filter((_, i) => i !== index));

  const addInvite = () => onInvitesChange([...invites, { email: '', role: 'MEMBER' }]);

  return (
    <div>
      <FormField label={t('create.nameLabel')} htmlFor="orgName" error={nameError}>
        <IconInput
          id="orgName"
          icon={Box}
          placeholder={t('create.namePlaceholder')}
          value={name}
          error={Boolean(nameError)}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </FormField>

      <div className="my-6 mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-faint">{t('create.inviteDivider')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-2.5">
        {invites.map((invite, index) => (
          <InviteRow
            key={index}
            value={invite}
            onChange={updateInvite(index)}
            onRemove={invites.length > 1 ? removeInvite(index) : undefined}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addInvite}
        className="mt-3 flex items-center gap-2 text-[13px] font-medium text-accent-purple transition-colors hover:text-primary-hover"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        {t('create.addPerson')}
      </button>
    </div>
  );
}
