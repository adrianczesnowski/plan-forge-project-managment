import { useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Popover } from '@/shared/ui/popover';
import { cn } from '@/shared/lib/utils';
import type { MemberRole } from '../model/roles';

interface RoleSelectProps {
  value: MemberRole;
  options: readonly MemberRole[];
  onChange: (role: MemberRole) => void;
  disabled?: boolean;
}

/** Compact dropdown to pick a member role, anchored to its trigger button. */
export function RoleSelect({ value, options, onChange, disabled }: RoleSelectProps) {
  const { t } = useTranslation('members');
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[12px] font-medium transition-colors',
          disabled ? 'cursor-default opacity-60' : 'hover:bg-muted',
        )}
      >
        {t(`roles.${value}`)}
        {!disabled && <ChevronDown className="h-3.5 w-3.5 text-faint" />}
      </button>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        placement="bottom-end"
        className="w-40"
      >
        {options.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => {
              onChange(role);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-muted/60"
          >
            <span>{t(`roles.${role}`)}</span>
            {role === value && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>
        ))}
      </Popover>
    </>
  );
}
