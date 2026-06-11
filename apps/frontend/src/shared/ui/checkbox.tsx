import type { InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

/** Styled native checkbox matching the view templates (purple check). */
export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'relative h-4 w-4 cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-border bg-white transition-all',
        'checked:border-primary checked:bg-primary',
        'after:absolute after:left-[4px] after:top-[1px] after:hidden after:h-2 after:w-[5px] after:rotate-45 after:border-r-2 after:border-b-2 after:border-white checked:after:block',
        className,
      )}
      {...props}
    />
  );
}
