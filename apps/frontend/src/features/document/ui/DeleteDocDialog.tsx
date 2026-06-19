import { useTranslation } from 'react-i18next';
import type { DocumentNodeType } from '@planforge/shared';
import { Dialog } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

interface DeleteDocDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  nodeType: DocumentNodeType;
  isPending: boolean;
  onConfirm: () => void;
}

export function DeleteDocDialog({
  open,
  onClose,
  title,
  nodeType,
  isPending,
  onConfirm,
}: DeleteDocDialogProps) {
  const { t } = useTranslation('docs');

  return (
    <Dialog open={open} onClose={onClose} title={t('deleteConfirm.title', { title })}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-muted-foreground">
          {nodeType === 'FOLDER'
            ? t('deleteConfirm.messageFolder')
            : t('deleteConfirm.messageDoc')}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            {t('deleteConfirm.cancel')}
          </Button>
          <Button variant="destructive" type="button" isLoading={isPending} onClick={onConfirm}>
            {t('deleteConfirm.confirm')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
