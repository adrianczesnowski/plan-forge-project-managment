import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-[13px] font-semibold leading-none text-foreground', className)}
      {...props}
    />
  );
}
