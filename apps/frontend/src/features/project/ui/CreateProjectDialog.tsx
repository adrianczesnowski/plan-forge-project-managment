import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { IconInput } from '@/shared/ui/icon-input';
import { FormField } from '@/shared/ui/form-field';
import { translateApiError } from '@/shared/lib/api-error';
import { useCreateProject } from '../hooks/use-create-project';

interface CreateProjectDialogProps {
  spaceId: string;
  open: boolean;
  onClose: () => void;
}

export function CreateProjectDialog({ spaceId, open, onClose }: CreateProjectDialogProps) {
  const { t } = useTranslation('projects');
  const createProject = useCreateProject();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nameError, setNameError] = useState<string>();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(t('create.nameRequired'));
      return;
    }
    setNameError(undefined);
    createProject.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        spaceId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('create.title')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label={t('create.nameLabel')} htmlFor="projectName" error={nameError}>
          <IconInput
            id="projectName"
            placeholder={t('create.namePlaceholder')}
            value={name}
            error={Boolean(nameError)}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </FormField>

        <FormField label={t('create.descriptionLabel')} htmlFor="projectDescription">
          <IconInput
            id="projectDescription"
            placeholder={t('create.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label={t('create.startDateLabel')} htmlFor="projectStart">
            <IconInput
              id="projectStart"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>
          <FormField label={t('create.endDateLabel')} htmlFor="projectEnd">
            <IconInput
              id="projectEnd"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FormField>
        </div>

        {createProject.isError && (
          <p className="text-sm text-destructive">{translateApiError(createProject.error)}</p>
        )}

        <Button type="submit" isLoading={createProject.isPending}>
          {t('create.submit')}
        </Button>
      </form>
    </Dialog>
  );
}
