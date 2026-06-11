import type { InputHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  /** Element rendered after the input (e.g. a password visibility toggle). */
  trailing?: ReactNode;
  error?: boolean;
}

/** Input wrapped in a bordered box with an optional leading icon, styled like the view templates. */
export function IconInput({ icon: Icon, trailing, error = false, className, ...props }: IconInputProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-[10px] border border-border bg-white px-3.5 transition-all',
        'hover:border-gray-300 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/10',
        error && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/10',
        className,
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 text-faint" />}
      <input
        className="w-full min-w-0 flex-1 bg-transparent py-3 text-[13.5px] text-foreground outline-none placeholder:text-faint"
        {...props}
      />
      {trailing}
    </div>
  );
}
