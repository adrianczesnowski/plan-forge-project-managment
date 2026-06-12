import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { IconInput } from '@/shared/ui/icon-input';
import { FormField } from '@/shared/ui/form-field';
import { cn } from '@/shared/lib/utils';
import { translateApiError } from '@/shared/lib/api-error';
import { useCreateSpace } from '../hooks/use-create-space';

const COLORS = ['#7c5cfc', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

interface CreateSpaceDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSpaceDialog({ open, onClose }: CreateSpaceDialogProps) {
  const { t } = useTranslation('spaces');
  const createSpace = useCreateSpace();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(COLORS[0]!);
  const [nameError, setNameError] = useState<string>();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(t('create.nameRequired'));
      return;
    }
    setNameError(undefined);
    createSpace.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('create.title')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label={t('create.nameLabel')} htmlFor="spaceName" error={nameError}>
          <IconInput
            id="spaceName"
            placeholder={t('create.namePlaceholder')}
            value={name}
            error={Boolean(nameError)}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </FormField>

        <FormField label={t('create.descriptionLabel')} htmlFor="spaceDescription">
          <IconInput
            id="spaceDescription"
            placeholder={t('create.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">{t('create.colorLabel')}</span>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'h-7 w-7 rounded-full transition-transform hover:scale-110',
                  color === c && 'ring-2 ring-offset-2 ring-foreground/30',
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {createSpace.isError && (
          <p className="text-sm text-destructive">{translateApiError(createSpace.error)}</p>
        )}

        <Button type="submit" isLoading={createSpace.isPending}>
          {t('create.submit')}
        </Button>
      </form>
    </Dialog>
  );
}
