import { useTranslation } from 'react-i18next';
import { Dialog } from './dialog';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
}

/** Lightweight yes/no confirmation built on top of the shared Dialog. */
export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  destructive,
  isLoading,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-5">
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {t('cancel')}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            size="sm"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel ?? t('confirm')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
